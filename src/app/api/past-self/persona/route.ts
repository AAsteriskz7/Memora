import { NextRequest, NextResponse } from 'next/server';
import { createLLMService } from '@/services/llm.service';
import { prisma } from '@/lib/prisma';
import { TimePeriod, ErrorResponse } from '@/types';

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

    // Fetch journal entries from the time period
    const entries = await prisma.entry.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        content: true,
        createdAt: true
      }
    });

    if (entries.length === 0) {
      const startStr = startDate.toLocaleDateString();
      const endStr = endDate.toLocaleDateString();
      return NextResponse.json(
        { error: `No journal entries found for the period ${startStr} to ${endStr}. Write some entries from this time period to create a persona.` } as ErrorResponse,
        { status: 400 }
      );
    }

    // Prepare entries for analysis (limit to prevent token overflow and speed up generation)
    const maxEntries = 15; // Reduced limit for faster generation
    const selectedEntries = entries.length > maxEntries 
      ? entries.slice(0, maxEntries) 
      : entries;

    const entriesText = selectedEntries
      .map((entry, index) => `Entry ${index + 1} (${entry.createdAt.toLocaleDateString()}):\n"${entry.content}"`)
      .join('\n\n');

    // Create persona analysis prompt
    const analysisPrompt = `Analyze these journal entries from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} and create a detailed persona description for an AI to embody this person from that specific time period.

JOURNAL ENTRIES:
${entriesText}

Create a comprehensive persona prompt that captures:

1. COMMUNICATION STYLE:
   - Vocabulary and slang used
   - Sentence structure (short/long, formal/casual)
   - Emotional expression patterns
   - Humor style and references

2. PERSONALITY TRAITS:
   - Dominant emotions and moods
   - Confidence level and self-perception
   - Social tendencies (introverted/extroverted)
   - Optimism vs pessimism

3. LIFE SITUATION & CONCERNS:
   - Major life events happening
   - Primary worries and stresses
   - Goals and aspirations
   - Relationships and social dynamics
   - Work/school situation

4. SPECIFIC DETAILS:
   - Names of people, places, activities mentioned
   - Specific interests and hobbies
   - Cultural references and media consumed
   - Daily routines and habits

5. TEMPORAL CONTEXT:
   - What year/season this represents
   - Life stage (student, new grad, etc.)
   - Major world events affecting them

Generate a detailed system prompt that starts with "You are speaking as yourself from ${startDate.getFullYear()}..." and includes specific examples of how this person would respond, what they'd bring up in conversation, and their authentic voice from that time.

Make it detailed enough that the AI can have natural conversations while staying true to who this person was during this specific period.`;

    // Generate persona using LLM service
    const llmService = createLLMService();
    const personaPrompt = await llmService.generateResponse(analysisPrompt);

    // Create a brief summary of the time period
    const summaryPrompt = `Based on these journal entries from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}, write a brief 2-3 sentence summary of what this person's life was like during this period. Focus on their main situation, concerns, and personality.

ENTRIES: ${entriesText.substring(0, 1000)}...`;

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