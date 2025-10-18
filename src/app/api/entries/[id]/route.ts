import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, UpdateEntryRequest } from "@/types";
import { createEntryService } from "@/services/entry.service";
import { createEmbeddingService } from "@/services/embedding.service";
import { createLLMService } from "@/services/llm.service";
import { prisma } from "@/lib/prisma";

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
 * GET /api/entries/[id]
 * Retrieve a specific journal entry by its unique identifier.
 *
 * @description Fetches a single journal entry by UUID. Returns the complete entry
 * including content, creation date, and last update timestamp.
 *
 * @param {string} id - Entry UUID (path parameter, required)
 *
 * @returns {Promise<NextResponse<JournalEntry>>} 200 - The requested journal entry
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Invalid or missing entry ID
 * @returns {Promise<NextResponse<ErrorResponse>>} 404 - Entry not found
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - Database unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/entries/550e8400-e29b-41d4-a716-446655440000
 *
 * // Response (200)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "content": "Today was an amazing day...",
 *   "createdAt": "2024-10-17T10:30:00.000Z",
 *   "updatedAt": "2024-10-17T10:30:00.000Z"
 * }
 *
 * // Error Response (404)
 * {
 *   "error": "Entry not found"
 * }
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
        { error: "Entry ID is required" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof id !== "string") {
      return NextResponse.json(
        { error: "Entry ID must be a string" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (id.trim().length === 0) {
      return NextResponse.json(
        { error: "Entry ID cannot be empty" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Call EntryService.getEntryById
    const { entryService } = getServices();
    const entry = await entryService.getEntryById(id);

    // Return 404 if entry not found
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" } as ErrorResponse, {
        status: 404,
      });
    }

    // Return 200 with entry
    return NextResponse.json(entry, { status: 200 });
  } catch (error) {
    console.error("Error retrieving entry by ID:", error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for validation errors from the service
      if (
        error.message.includes("Entry ID cannot be empty") ||
        error.message.includes("Entry ID") ||
        error.message.includes("cannot be empty")
      ) {
        return NextResponse.json({ error: error.message } as ErrorResponse, {
          status: 400,
        });
      }

      // Check for database connection errors
      if (
        error.message.includes("database") ||
        error.message.includes("connection") ||
        error.message.includes("ECONNREFUSED")
      ) {
        return NextResponse.json(
          {
            error: "Database connection error. Please try again later.",
          } as ErrorResponse,
          { status: 503 }
        );
      }

      // Check for specific "not found" errors from service
      if (
        error.message.includes("not found") ||
        error.message.includes("does not exist")
      ) {
        return NextResponse.json(
          { error: "Entry not found" } as ErrorResponse,
          { status: 404 }
        );
      }
    }

    // Generic server error for unexpected issues
    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/entries/[id]
 * Update an existing journal entry with automatic embedding regeneration.
 *
 * @description Updates the content of an existing journal entry and automatically
 * regenerates embeddings for semantic search. The original creation date is preserved,
 * but the updatedAt timestamp is refreshed.
 *
 * @param {string} id - Entry UUID (path parameter, required)
 * @param {UpdateEntryRequest} body - Request body containing new content
 * @param {string} body.content - New entry content (1-10,000 characters, required)
 *
 * @returns {Promise<NextResponse<JournalEntry>>} 200 - Updated entry with new content and timestamp
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Invalid content or entry ID
 * @returns {Promise<NextResponse<ErrorResponse>>} 404 - Entry not found
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - Database or AI service unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 *
 * @example
 * // Request
 * PUT /api/entries/550e8400-e29b-41d4-a716-446655440000
 * {
 *   "content": "Updated: Today was an absolutely incredible day! I learned even more than I initially thought."
 * }
 *
 * // Response (200)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "content": "Updated: Today was an absolutely incredible day! I learned even more than I initially thought.",
 *   "createdAt": "2024-10-17T10:30:00.000Z",
 *   "updatedAt": "2024-10-17T11:45:00.000Z"
 * }
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
        { error: "Entry ID is required" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof id !== "string") {
      return NextResponse.json(
        { error: "Entry ID must be a string" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (id.trim().length === 0) {
      return NextResponse.json(
        { error: "Entry ID cannot be empty" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body: UpdateEntryRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate content field
    if (!body.content) {
      return NextResponse.json(
        { error: "Content is required" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (body.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content cannot be empty" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (body.content.length > 10000) {
      return NextResponse.json(
        { error: "Content cannot exceed 10,000 characters" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Call EntryService.updateEntry
    const { entryService } = getServices();
    const updatedEntry = await entryService.updateEntry(id, body.content);

    // Return 200 with updated entry
    return NextResponse.json(updatedEntry, { status: 200 });
  } catch (error) {
    console.error("Error updating entry:", error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for validation errors from the service
      if (
        error.message.includes("Entry ID cannot be empty") ||
        error.message.includes("Entry content cannot be empty") ||
        error.message.includes("Entry content cannot exceed 10,000 characters")
      ) {
        return NextResponse.json({ error: error.message } as ErrorResponse, {
          status: 400,
        });
      }

      // Check for "not found" errors from service
      if (
        error.message.includes("Entry not found") ||
        error.message.includes("not found") ||
        error.message.includes("does not exist")
      ) {
        return NextResponse.json(
          { error: "Entry not found" } as ErrorResponse,
          { status: 404 }
        );
      }

      // Check for database connection errors
      if (
        error.message.includes("database") ||
        error.message.includes("connection") ||
        error.message.includes("ECONNREFUSED")
      ) {
        return NextResponse.json(
          {
            error: "Database connection error. Please try again later.",
          } as ErrorResponse,
          { status: 503 }
        );
      }

      // Check for embedding service errors
      if (
        error.message.includes("embedding") ||
        error.message.includes("LLM") ||
        error.message.includes("API")
      ) {
        return NextResponse.json(
          {
            error: "Service temporarily unavailable. Please try again later.",
          } as ErrorResponse,
          { status: 503 }
        );
      }
    }

    // Generic server error for unexpected issues
    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}
/**
 * DELETE /api/entries/[id]
 * Permanently delete a journal entry and remove it from past-self conversation context.
 *
 * @description Permanently removes a journal entry from the database. This action cannot
 * be undone. The entry will also be removed from past-self conversation context immediately.
 *
 * @param {string} id - Entry UUID (path parameter, required)
 *
 * @returns {Promise<NextResponse>} 204 - Entry successfully deleted (no content)
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Invalid or missing entry ID
 * @returns {Promise<NextResponse<ErrorResponse>>} 404 - Entry not found
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - Database unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 *
 * @example
 * // Request
 * DELETE /api/entries/550e8400-e29b-41d4-a716-446655440000
 *
 * // Response (204)
 * // No content returned
 *
 * // Error Response (404)
 * {
 *   "error": "Entry not found"
 * }
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
        { error: "Entry ID is required" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (typeof id !== "string") {
      return NextResponse.json(
        { error: "Entry ID must be a string" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (id.trim().length === 0) {
      return NextResponse.json(
        { error: "Entry ID cannot be empty" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Call EntryService.deleteEntry
    const { entryService } = getServices();
    await entryService.deleteEntry(id);

    // Return 204 no content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting entry:", error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for validation errors from the service
      if (
        error.message.includes("Entry ID cannot be empty") ||
        error.message.includes("Entry ID") ||
        error.message.includes("cannot be empty")
      ) {
        return NextResponse.json({ error: error.message } as ErrorResponse, {
          status: 400,
        });
      }

      // Check for "not found" errors from service
      if (
        error.message.includes("Entry not found") ||
        error.message.includes("not found") ||
        error.message.includes("does not exist")
      ) {
        return NextResponse.json(
          { error: "Entry not found" } as ErrorResponse,
          { status: 404 }
        );
      }

      // Check for database connection errors
      if (
        error.message.includes("database") ||
        error.message.includes("connection") ||
        error.message.includes("ECONNREFUSED")
      ) {
        return NextResponse.json(
          {
            error: "Database connection error. Please try again later.",
          } as ErrorResponse,
          { status: 503 }
        );
      }
    }

    // Generic server error for unexpected issues
    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}
