import { NextRequest, NextResponse } from 'next/server';
import { CreateEntryRequest, ErrorResponse } from '@/types';
import { createEntryService } from '@/services/entry.service';
import { createEmbeddingService } from '@/services/embedding.service';
import { createLLMService } from '@/services/llm.service';
import { prisma } from '@/lib/prisma';

// Lazy service initialization to avoid build-time errors
let services: {
  llmService: ReturnType<typeof createLLMService>;
  embeddingService: ReturnType<typeof createEmbeddingService>;
  entryService: ReturnType<typeof createEntryService>;
} | null = null;

function getServices() {
  if (!services) {
    const llmService = createLLMService();
    const embeddingService = createEmbeddingService(llmService, prisma);
    const entryService = createEntryService(prisma, embeddingService);
    services = { llmService, embeddingService, entryService };
  }
  return services;
}

/**
 * POST /api/entries
 * Create a new journal entry with automatic embedding generation for semantic search.
 * 
 * @description Creates a new journal entry and automatically generates embeddings for semantic search.
 * The entry will be available for past-self conversations immediately after creation.
 * 
 * @param {CreateEntryRequest} body - Request body containing entry content and optional creation date
 * @param {string} body.content - Entry content (1-10,000 characters, required)
 * @param {string} [body.createdAt] - ISO 8601 date string (optional, defaults to current time, cannot be future)
 * 
 * @returns {Promise<NextResponse<JournalEntry>>} 201 - Created entry with generated ID and timestamps
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Validation error (invalid content, future date, etc.)
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - Database or AI service unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 * 
 * @example
 * // Request
 * POST /api/entries
 * {
 *   "content": "Today I learned about semantic search and embeddings. Fascinating stuff!",
 *   "createdAt": "2024-10-17T10:30:00Z"
 * }
 * 
 * // Response (201)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "content": "Today I learned about semantic search and embeddings. Fascinating stuff!",
 *   "createdAt": "2024-10-17T10:30:00.000Z",
 *   "updatedAt": "2024-10-17T10:30:00.000Z"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: CreateEntryRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate content type
    if (typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate content length
    if (body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content cannot be empty' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (body.content.length > 10000) {
      return NextResponse.json(
        { error: 'Content cannot exceed 10,000 characters' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate optional createdAt field
    let createdAt: Date | undefined;
    if (body.createdAt) {
      if (typeof body.createdAt !== 'string') {
        return NextResponse.json(
          { error: 'createdAt must be a valid ISO 8601 date string' } as ErrorResponse,
          { status: 400 }
        );
      }

      createdAt = new Date(body.createdAt);
      if (isNaN(createdAt.getTime())) {
        return NextResponse.json(
          { error: 'createdAt must be a valid ISO 8601 date string' } as ErrorResponse,
          { status: 400 }
        );
      }

      // Prevent future dates
      if (createdAt > new Date()) {
        return NextResponse.json(
          { error: 'createdAt cannot be in the future' } as ErrorResponse,
          { status: 400 }
        );
      }
    }

    // Create the entry using EntryService
    const { entryService } = getServices();
    const entry = await entryService.createEntry(body.content, createdAt);

    // Return success response with 201 status
    return NextResponse.json(entry, { status: 201 });

  } catch (error) {
    console.error('Error creating entry:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for specific validation errors from the service
      if (error.message.includes('cannot be empty') || 
          error.message.includes('cannot exceed') ||
          error.message.includes('required')) {
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
          { error: 'Database connection error. Please try again later.' } as ErrorResponse,
          { status: 503 }
        );
      }

      // Check for embedding service errors
      if (error.message.includes('embedding') || 
          error.message.includes('LLM') ||
          error.message.includes('API')) {
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

/**
 * GET /api/entries
 * Retrieve a paginated list of journal entries, sorted by creation date (newest first).
 * 
 * @description Fetches journal entries with optional pagination and date filtering.
 * Entries are always sorted by creation date in descending order (newest first).
 * 
 * @param {number} [page=1] - Page number (minimum: 1)
 * @param {number} [limit=20] - Items per page (minimum: 1, maximum: 100)
 * @param {string} [startDate] - ISO 8601 date string to filter entries from (inclusive)
 * @param {string} [endDate] - ISO 8601 date string to filter entries until (inclusive)
 * 
 * @returns {Promise<NextResponse<PaginatedResponse<JournalEntry>>>} 200 - Paginated list of entries
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Invalid pagination parameters or date format
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - Database unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 * 
 * @example
 * // Request
 * GET /api/entries?page=1&limit=5&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z
 * 
 * // Response (200)
 * {
 *   "entries": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "content": "Today was great...",
 *       "createdAt": "2024-10-17T10:30:00.000Z",
 *       "updatedAt": "2024-10-17T10:30:00.000Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 5,
 *     "total": 150,
 *     "totalPages": 30
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Extract and validate query parameters
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Validate and parse page parameter
    let page = 1;
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return NextResponse.json(
          { error: 'Page must be a positive integer' } as ErrorResponse,
          { status: 400 }
        );
      }
      page = parsedPage;
    }

    // Validate and parse limit parameter
    let limit = 20;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return NextResponse.json(
          { error: 'Limit must be between 1 and 100' } as ErrorResponse,
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Validate and parse date parameters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'startDate must be a valid ISO 8601 date string' } as ErrorResponse,
          { status: 400 }
        );
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'endDate must be a valid ISO 8601 date string' } as ErrorResponse,
          { status: 400 }
        );
      }
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Call EntryService.getEntries with pagination options
    const { entryService } = getServices();
    const result = await entryService.getEntries({
      page,
      limit,
      startDate,
      endDate,
    });

    // Return paginated response with entries and metadata
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error retrieving entries:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for validation errors from the service
      if (error.message.includes('Page must be') || 
          error.message.includes('Limit must be') ||
          error.message.includes('Start date must be') ||
          error.message.includes('date')) {
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
          { error: 'Database connection error. Please try again later.' } as ErrorResponse,
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