import { NextRequest, NextResponse } from 'next/server';
import { createLLMService } from '@/services/llm.service';
import { prisma } from '@/lib/prisma';
import { TimePeriod, ErrorResponse } from '@/types';

// Simple in-memory cache for persona generation
const personaCache = new Map<string, {
  data: any;
  timestamp: number;
  expiresIn: number;
}>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface PersonaRequest {
  timePeriod: {
    start: string;
    end: string;
  };
}

interface PersonaResponse {
  personaPrompt: string;
  timePeriod: TimePeriod;
  entriesAnalyzed: number;
  summary: string;
}

/**
 * POST /api/past-self/persona
 * Generate a persona prompt by analyzing journal entries from a specific time period.
 * 
 * @description Analyzes journal entries from the specified time period to create a detailed
 * persona description that captures the user's personality, concerns, vocabulary, and life
 * situation from that era. This persona is then used for authentic past-self conversations.
 * 
 * @param {PersonaRequest} body - Request body containing time period
 * @param {object} body.timePeriod - Time period to analyze
 * @param {string} body.timePeriod.start - Start date (ISO 8601)
 * @param {string} body.timePeriod.end - End date (ISO 8601)
 * 
 * @returns {Promise<NextResponse<PersonaResponse>>} 200 - Generated persona prompt and metadata
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Invalid request or no entries found
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - AI service unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: PersonaRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.timePeriod?.start || !body.timePeriod?.end) {
      return NextResponse.json(
        { error: 'timePeriod with start and end dates is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Create cache key from time period
    const cacheKey = `${body.timePeriod.start}-${body.timePeriod.end}`;
    
    // Check cache first
    const cached = personaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.expiresIn) {
      console.log('Returning cached persona');
      return NextResponse.json(cached.data, { status: 200 });
    }

    // Parse and validate dates
    let startDate: Date;
    let endDate: Date;
    
    try {
      startDate = new Date(body.timePeriod.start);
      endDate = new Date(body.timePeriod.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }
      
      // Prevent future dates
      const now = new Date();
      if (endDate > now) {
        throw new Error('End date cannot be in the future');
      }
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid date format: ${error instanceof Error ? error.message : 'Unknown error'}` } as ErrorResponse,
        { status: 400 }
      );
    }

    // Check if this is a fast initial request
    const isFastRequest = request.headers.get('x-fast-mode') === 'true';
    const entryLimit = isFastRequest ? 5 : 15;

    // Fetch journal entries from the time period
    const entries = await prisma.entry.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc' // Most recent first for better context
      },
      select: {
        content: true,
        createdAt: true
      },
      take: entryLimit
    });

    if (entries.length === 0) {
      const startStr = startDate.toLocaleDateString();
      const endStr = endDate.toLocaleDateString();
      return NextResponse.json(
        { error: `No journal entries found for the period ${startStr} to ${endStr}. Write some entries from this time period to create a persona.` } as ErrorResponse,
        { status: 400 }
      );
    }

    // Prepare entries for analysis
    const maxEntries = isFastRequest ? 3 : 10; // Very fast for initial request
    const selectedEntries = entries.length > maxEntries 
      ? entries.slice(0, maxEntries) 
      : entries;

    const entriesText = selectedEntries
      .map((entry, index) => `Entry ${index + 1} (${entry.createdAt.toLocaleDateString()}):\n"${entry.content}"`)
      .join('\n\n');

    // Create persona analysis prompt (shorter for fast mode)
    const analysisPrompt = isFastRequest 
      ? `Quick persona from ${startDate.getFullYear()} based on these entries:

${entriesText}

Create a brief system prompt starting with "You are speaking as yourself from ${startDate.getFullYear()}..." capturing basic personality and communication style.`
      : `Analyze these journal entries and create a persona prompt for an AI to embody this person from ${startDate.getFullYear()}.

ENTRIES:
${entriesText}

Create a system prompt starting with "You are speaking as yourself from ${startDate.getFullYear()}..." that captures:
- Communication style and vocabulary
- Personality traits and emotions  
- Life situation and concerns
- Specific people, places, interests mentioned
- Authentic voice from this time period

Keep it focused and conversational.`;

    // Generate persona using LLM service
    const llmService = createLLMService();
    const personaPrompt = await llmService.generateResponse(analysisPrompt);

    // Create a brief summary of the time period
    const summaryPrompt = `Summarize this person's life in ${startDate.getFullYear()} in 2-3 sentences based on these entries:

${entriesText.substring(0, 800)}...`;

    const summary = await llmService.generateResponse(summaryPrompt);

    const response: PersonaResponse = {
      personaPrompt: personaPrompt.trim(),
      timePeriod: {
        start: startDate,
        end: endDate
      },
      entriesAnalyzed: entries.length,
      summary: summary.trim()
    };

    // Cache the response
    personaCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      expiresIn: CACHE_DURATION
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error generating persona:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for database connection errors
      if (error.message.includes('database') || 
          error.message.includes('connection') ||
          error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again later.' } as ErrorResponse,
          { status: 503 }
        );
      }

      // Check for AI service errors
      if (error.message.includes('API') || 
          error.message.includes('LLM') ||
          error.message.includes('Claude') ||
          error.message.includes('Anthropic')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' } as ErrorResponse,
          { status: 503 }
        );
      }
    }

    // Generic server error for unexpected issues
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' } as ErrorResponse,
      { status: 500 }
    );
  }
}