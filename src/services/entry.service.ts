import { PrismaClient } from '@prisma/client';
import { JournalEntry, GetEntriesOptions, PaginatedResponse } from '@/types';
import { EmbeddingService } from './embedding.service';

export interface EntryServiceConfig {
  prisma: PrismaClient;
  embeddingService: EmbeddingService;
}

export class EntryService {
  private prisma: PrismaClient;
  private embeddingService: EmbeddingService;

  constructor(config: EntryServiceConfig) {
    this.prisma = config.prisma;
    this.embeddingService = config.embeddingService;
  }

  /**
   * Create a new journal entry with automatic embedding generation
   */
  async createEntry(content: string, createdAt?: Date): Promise<JournalEntry> {
    if (!content || content.trim().length === 0) {
      throw new Error('Entry content cannot be empty');
    }

    if (content.length > 10000) {
      throw new Error('Entry content cannot exceed 10,000 characters');
    }

    try {
      // Generate embedding for the content
      const embedding = await this.embeddingService.generateEmbedding(content);
      const entryDate = createdAt || new Date();

      // Use raw SQL to insert with embedding
      const result = await this.prisma.$queryRaw`
        INSERT INTO entries (id, content, embedding, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${content.trim()}, ${JSON.stringify(embedding)}::vector, ${entryDate}, ${entryDate})
        RETURNING id, content, "createdAt", "updatedAt"
      ` as JournalEntry[];

      return result[0];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create entry: ${error.message}`);
      }
      throw new Error('Failed to create entry: Unknown error');
    }
  }

  /**
   * Get entries with pagination and date filtering
   */
  async getEntries(options: GetEntriesOptions = {}): Promise<PaginatedResponse<JournalEntry>> {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = options;

    // Validate pagination parameters
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    try {
      // Build where clause for date filtering
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get total count for pagination metadata
      const total = await this.prisma.entry.count({ where });

      // Get entries with pagination
      const entries = await this.prisma.entry.findMany({
        where,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return {
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get entries: ${error.message}`);
      }
      throw new Error('Failed to get entries: Unknown error');
    }
  }

  /**
   * Get a single entry by ID
   */
  async getEntryById(id: string): Promise<JournalEntry | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('Entry ID cannot be empty');
    }

    try {
      const entry = await this.prisma.entry.findUnique({
        where: { id: id.trim() },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return entry;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get entry: ${error.message}`);
      }
      throw new Error('Failed to get entry: Unknown error');
    }
  }

  /**
   * Update an existing entry with embedding regeneration
   */
  async updateEntry(id: string, content: string): Promise<JournalEntry> {
    if (!id || id.trim().length === 0) {
      throw new Error('Entry ID cannot be empty');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Entry content cannot be empty');
    }

    if (content.length > 10000) {
      throw new Error('Entry content cannot exceed 10,000 characters');
    }

    try {
      // Check if entry exists
      const existingEntry = await this.prisma.entry.findUnique({
        where: { id: id.trim() },
        select: { id: true },
      });

      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      // Generate new embedding for the updated content
      const embedding = await this.embeddingService.generateEmbedding(content);
      const updateDate = new Date();

      // Use raw SQL to update with embedding
      const result = await this.prisma.$queryRaw`
        UPDATE entries 
        SET content = ${content.trim()}, 
            embedding = ${JSON.stringify(embedding)}::vector, 
            "updatedAt" = ${updateDate}
        WHERE id = ${id.trim()}
        RETURNING id, content, "createdAt", "updatedAt"
      ` as JournalEntry[];

      return result[0];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update entry: ${error.message}`);
      }
      throw new Error('Failed to update entry: Unknown error');
    }
  }

  /**
   * Delete an entry with proper cleanup
   */
  async deleteEntry(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Entry ID cannot be empty');
    }

    try {
      // Check if entry exists
      const existingEntry = await this.prisma.entry.findUnique({
        where: { id: id.trim() },
      });

      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      // Delete the entry
      await this.prisma.entry.delete({
        where: { id: id.trim() },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete entry: ${error.message}`);
      }
      throw new Error('Failed to delete entry: Unknown error');
    }
  }

  /**
   * Search entries by date range (helper method for other services)
   */
  async searchEntriesByDateRange(start: Date, end: Date): Promise<JournalEntry[]> {
    if (start > end) {
      throw new Error('Start date must be before end date');
    }

    try {
      const entries = await this.prisma.entry.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return entries;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search entries by date range: ${error.message}`);
      }
      throw new Error('Failed to search entries by date range: Unknown error');
    }
  }
}

// Factory function to create entry service with dependencies
export function createEntryService(
  prisma: PrismaClient,
  embeddingService: EmbeddingService
): EntryService {
  return new EntryService({
    prisma,
    embeddingService,
  });
}