import { NextRequest, NextResponse } from 'next/server';
import { ErrorResponse, UpdateEntryRequest } from '@/types';
import { createEntryService } from '@/services/entry.service';
import { createEmbeddingService } from '@/services/embedding.service';
import { createLLMService } from '@/services/llm.service';
import { prisma } from '@/lib/prisma';

// Initialize services
const llmService = createLLMService();
const embeddingService = createEmbeddingService(llmService, prisma);
const entryService = createEntryService(prisma, embeddingService);

/**
 * GET /api/entries/[id]
 * Retrieve a specific journal entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Validate entry ID parameter
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Entry ID must be a string' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Entry ID cannot be empty' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Call EntryService.getEntryById
    const entry = await entryService.getEntryById(id);

    // Return 404 if entry not found
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' } as ErrorResponse,
        { status: 404 }
      );
    }

    // Return 200 with entry
    return NextResponse.json(entry, { status: 200 });

  } catch (error) {
    console.error('Error retrieving entry by ID:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for validation errors from the service
      if (error.message.includes('Entry ID cannot be empty') ||
          error.message.includes('Entry ID') ||
          error.message.includes('cannot be empty')) {
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

      // Check for specific "not found" errors from service
      if (error.message.includes('not found') || 
          error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Entry not found' } as ErrorResponse,
          { status: 404 }
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
 * PUT /api/entries/[id]
 * Update an existing journal entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Validate entry ID parameter
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Entry ID must be a string' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Entry ID cannot be empty' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body: UpdateEntryRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate content field
    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' } as ErrorResponse,
        { status: 400 }
      );
    }

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

    // Call EntryService.updateEntry
    const updatedEntry = await entryService.updateEntry(id, body.content);

    // Return 200 with updated entry
    return NextResponse.json(updatedEntry, { status: 200 });

  } catch (error) {
    console.error('Error updating entry:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for validation errors from the service
      if (error.message.includes('Entry ID cannot be empty') ||
          error.message.includes('Entry content cannot be empty') ||
          error.message.includes('Entry content cannot exceed 10,000 characters')) {
        return NextResponse.json(
          { error: error.message } as ErrorResponse,
          { status: 400 }
        );
      }

      // Check for "not found" errors from service
      if (error.message.includes('Entry not found') || 
          error.message.includes('not found') ||
          error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Entry not found' } as ErrorResponse,
          { status: 404 }
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
          { error: 'Service temporarily unavailable. Please try again later.' } as ErrorResponse,
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
 * 
DELETE /api/entries/[id]
 * Delete a journal entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Validate entry ID parameter
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Entry ID must be a string' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Entry ID cannot be empty' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Call EntryService.deleteEntry
    await entryService.deleteEntry(id);

    // Return 204 no content on success
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error deleting entry:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for validation errors from the service
      if (error.message.includes('Entry ID cannot be empty') ||
          error.message.includes('Entry ID') ||
          error.message.includes('cannot be empty')) {
        return NextResponse.json(
          { error: error.message } as ErrorResponse,
          { status: 400 }
        );
      }

      // Check for "not found" errors from service
      if (error.message.includes('Entry not found') || 
          error.message.includes('not found') ||
          error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Entry not found' } as ErrorResponse,
          { status: 404 }
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