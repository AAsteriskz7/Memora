import { NextRequest, NextResponse } from 'next/server';
import { CreateEntryRequest, ErrorResponse } from '@/types';
import { createEntryService } from '@/services/entry.service';
import { createEmbeddingService } from '@/services/embedding.service';
import { createLLMService } from '@/services/llm.service';
import { prisma } from '@/lib/prisma';

// Initialize services
const llmService = createLLMService();
const embeddingService = createEmbeddingService(llmService, prisma);
const entryService = createEntryService(prisma, embeddingService);

/**
 * POST /api/entries
 * Create a new journal entry
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: CreateEntryRequest;
    try {
      body = await request.json();
    } catch (error) {
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
 * Retrieve paginated list of journal entries
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