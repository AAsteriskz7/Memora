import { NextRequest, NextResponse } from 'next/server';
import { ErrorResponse, TimePeriodPreset } from '@/types';
import { createPastSelfService } from '@/services/past-self.service';
import { createLLMService } from '@/services/llm.service';
import { createEmbeddingService } from '@/services/embedding.service';
import { prisma } from '@/lib/prisma';

// Request body interface for past-self queries
interface PastSelfQueryRequest {
  query: string;
  timePeriod?: {
    start?: string;
    end?: string;
  };
  preset?: TimePeriodPreset;
}

// Lazy service initialization to avoid build-time errors
let services: {
  llmService: ReturnType<typeof createLLMService>;
  embeddingService: ReturnType<typeof createEmbeddingService>;
  pastSelfService: ReturnType<typeof createPastSelfService>;
} | null = null;

function getServices() {
  if (!services) {
    const llmService = createLLMService();
    const embeddingService = createEmbeddingService(llmService, prisma);
    const pastSelfService = createPastSelfService(llmService, embeddingService, prisma);
    services = { llmService, embeddingService, pastSelfService };
  }
  return services;
}

/**
 * POST /api/past-self/query
 * Query your past self through journal entries using semantic search and AI response generation.
 * 
 * @description Ask questions to your past self from specific time periods. The system performs
 * semantic search across your journal entries, finds the most relevant ones, and generates
 * a response as if your past self wrote it. You can specify either a custom time period
 * or use predefined presets.
 * 
 * @param {PastSelfQueryRequest} body - Request body containing query and time constraints
 * @param {string} body.query - Your question to past self (1-1,000 characters, required)
 * @param {Object} [body.timePeriod] - Custom time period (optional, mutually exclusive with preset)
 * @param {string} [body.timePeriod.start] - ISO 8601 start date (optional)
 * @param {string} [body.timePeriod.end] - ISO 8601 end date (optional)
 * @param {TimePeriodPreset} [body.preset] - Predefined time period (optional, mutually exclusive with timePeriod)
 * 
 * @returns {Promise<NextResponse<PastSelfResponse>>} 200 - Past-self response with references and metadata
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Invalid query, dates, preset, or no entries found
 * @returns {Promise<NextResponse<ErrorResponse>>} 429 - AI service rate limit exceeded
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - Database or AI service unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 * 
 * @example
 * // Request with custom time period
 * POST /api/past-self/query
 * {
 *   "query": "What was I thinking about my career in 2023?",
 *   "timePeriod": {
 *     "start": "2023-01-01T00:00:00Z",
 *     "end": "2023-12-31T23:59:59Z"
 *   }
 * }
 * 
 * @example
 * // Request with preset
 * POST /api/past-self/query
 * {
 *   "query": "How did I feel about relationships back then?",
 *   "preset": "college-years"
 * }
 * 
 * @example
 * // Response (200)
 * {
 *   "response": "Back in 2023, I was really excited about the new opportunities in tech...",
 *   "references": [
 *     {
 *       "entryId": "550e8400-e29b-41d4-a716-446655440000",
 *       "date": "2023-03-15T10:30:00.000Z",
 *       "excerpt": "I've been thinking a lot about switching careers lately...",
 *       "relevanceScore": 0.95
 *     }
 *   ],
 *   "metadata": {
 *     "entriesSearched": 45,
 *     "timePeriod": {
 *       "start": "2023-01-01T00:00:00.000Z",
 *       "end": "2023-12-31T23:59:59.000Z"
 *     },
 *     "warning": "Limited entries available for this time period"
 *   }
 * }
 * 
 * @example
 * // Error Response - No entries (400)
 * {
 *   "error": "No journal entries found. Please write your first entry to start conversations with your past self.",
 *   "code": "NO_ENTRIES"
 * }
 * 
 * @example
 * // Error Response - Invalid preset (400)
 * {
 *   "error": "Invalid preset. Valid presets are: 1-month-ago, 3-months-ago, ...",
 *   "code": "INVALID_PRESET",
 *   "details": {
 *     "validPresets": ["1-month-ago", "3-months-ago", "6-months-ago", ...]
 *   }
 * }
 * 
 * @see {@link TimePeriodPreset} for available preset options
 * @see {@link PastSelfResponse} for complete response structure
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: PastSelfQueryRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate query type and content
    if (typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query must be a string' } as ErrorResponse,
        { status: 400 }
      );
    }

    const trimmedQuery = body.query.trim();
    if (trimmedQuery.length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (trimmedQuery.length > 1000) {
      return NextResponse.json(
        { error: 'Query cannot exceed 1,000 characters' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate timePeriod if provided
    let timePeriod: { start?: Date; end?: Date } | undefined;
    if (body.timePeriod) {
      timePeriod = {};

      if (body.timePeriod.start) {
        if (typeof body.timePeriod.start !== 'string') {
          return NextResponse.json(
            { error: 'timePeriod.start must be a valid ISO 8601 date string' } as ErrorResponse,
            { status: 400 }
          );
        }

        const startDate = new Date(body.timePeriod.start);
        if (isNaN(startDate.getTime())) {
          return NextResponse.json(
            { error: 'timePeriod.start must be a valid ISO 8601 date string' } as ErrorResponse,
            { status: 400 }
          );
        }
        timePeriod.start = startDate;
      }

      if (body.timePeriod.end) {
        if (typeof body.timePeriod.end !== 'string') {
          return NextResponse.json(
            { error: 'timePeriod.end must be a valid ISO 8601 date string' } as ErrorResponse,
            { status: 400 }
          );
        }

        const endDate = new Date(body.timePeriod.end);
        if (isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: 'timePeriod.end must be a valid ISO 8601 date string' } as ErrorResponse,
            { status: 400 }
          );
        }
        timePeriod.end = endDate;
      }

      // Validate date range
      if (timePeriod.start && timePeriod.end && timePeriod.start > timePeriod.end) {
        return NextResponse.json(
          { error: 'timePeriod.start must be before timePeriod.end' } as ErrorResponse,
          { status: 400 }
        );
      }
    }

    // Validate preset if provided
    if (body.preset) {
      if (typeof body.preset !== 'string') {
        return NextResponse.json(
          { error: 'Preset must be a string' } as ErrorResponse,
          { status: 400 }
        );
      }

      // Check if preset is valid using TimePeriodPresets utility (no service needed)
      const validPresets: TimePeriodPreset[] = [
        '1-month-ago', '3-months-ago', '6-months-ago', '1-year-ago', 
        '2-years-ago', '3-years-ago', '5-years-ago', '10-years-ago',
        'college-years', 'high-school-years', 'early-career', 'last-decade'
      ];
      
      if (!validPresets.includes(body.preset as TimePeriodPreset)) {
        return NextResponse.json(
          { 
            error: `Invalid preset. Valid presets are: ${validPresets.join(', ')}`,
            code: 'INVALID_PRESET',
            details: { validPresets }
          } as ErrorResponse,
          { status: 400 }
        );
      }
    }

    // Validate that only one of timePeriod or preset is provided
    if (body.timePeriod && body.preset) {
      return NextResponse.json(
        { error: 'Cannot specify both timePeriod and preset. Choose one.' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Call PastSelfService.query with the validated parameters
    const { pastSelfService } = getServices();
    const pastSelfQuery = {
      query: trimmedQuery,
      timePeriod,
      preset: body.preset as TimePeriodPreset | undefined
    };

    const result = await pastSelfService.query(pastSelfQuery);

    // Convert dates to ISO strings for JSON response
    const response = {
      response: result.response,
      references: result.references.map(ref => ({
        entryId: ref.entryId,
        date: ref.date.toISOString(),
        excerpt: ref.excerpt,
        relevanceScore: ref.relevanceScore
      })),
      metadata: {
        entriesSearched: result.metadata.entriesSearched,
        timePeriod: {
          start: result.metadata.timePeriod.start.toISOString(),
          end: result.metadata.timePeriod.end.toISOString()
        },
        warning: result.metadata.warning
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error processing past-self query:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Handle specific error cases from PastSelfService
      if (error.message.includes('No journal entries found')) {
        return NextResponse.json(
          { 
            error: error.message,
            code: 'NO_ENTRIES'
          } as ErrorResponse,
          { status: 400 }
        );
      }

      if (error.message.includes('Invalid time period preset')) {
        return NextResponse.json(
          { 
            error: error.message,
            code: 'INVALID_PRESET'
          } as ErrorResponse,
          { status: 400 }
        );
      }

      if (error.message.includes('Failed to resolve preset')) {
        return NextResponse.json(
          { 
            error: error.message,
            code: 'PRESET_RESOLUTION_ERROR'
          } as ErrorResponse,
          { status: 400 }
        );
      }

      if (error.message.includes('Query cannot be empty')) {
        return NextResponse.json(
          { error: error.message } as ErrorResponse,
          { status: 400 }
        );
      }

      // Check for database connection errors
      if (error.message.includes('database') || 
          error.message.includes('connection') ||
          error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            error: 'Database connection error. Please try again later.',
            code: 'DATABASE_ERROR'
          } as ErrorResponse,
          { status: 503 }
        );
      }

      // Check for LLM/embedding service errors
      if (error.message.includes('Failed to generate past-self response') ||
          error.message.includes('Failed to find relevant entries') ||
          error.message.includes('embedding') || 
          error.message.includes('LLM') ||
          error.message.includes('API')) {
        return NextResponse.json(
          { 
            error: 'AI service temporarily unavailable. Please try again later.',
            code: 'AI_SERVICE_ERROR'
          } as ErrorResponse,
          { status: 503 }
        );
      }

      // Check for rate limiting or quota errors
      if (error.message.includes('rate limit') || 
          error.message.includes('quota') ||
          error.message.includes('429')) {
        return NextResponse.json(
          { 
            error: 'AI service rate limit exceeded. Please try again in a few minutes.',
            code: 'RATE_LIMIT_ERROR'
          } as ErrorResponse,
          { status: 429 }
        );
      }
    }

    // Generic server error for unexpected issues
    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        code: 'INTERNAL_ERROR'
      } as ErrorResponse,
      { status: 500 }
    );
  }
}