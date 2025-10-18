import { PrismaClient } from '@prisma/client';
import { LLMService } from './llm.service';
import { EntryReference, TimePeriod } from '@/types';

export interface EmbeddingServiceConfig {
  llmService: LLMService;
  prisma: PrismaClient;
}

export class EmbeddingService {
  private llmService: LLMService;
  private prisma: PrismaClient;

  constructor(config: EmbeddingServiceConfig) {
    this.llmService = config.llmService;
    this.prisma = config.prisma;
  }

  /**
   * Generate embedding for text using the LLM service
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.llmService.generateEmbedding(text);
  }

  /**
   * Find similar entries using pgvector cosine similarity
   */
  async findSimilarEntries(
    queryEmbedding: number[],
    limit: number = 5,
    timePeriod?: TimePeriod
  ): Promise<EntryReference[]> {
    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error('Query embedding cannot be empty');
    }

    if (limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }

    try {
      // Build the SQL query with optional time period filtering
      let whereClause = '';
      const params: any[] = [JSON.stringify(queryEmbedding), limit];
      
      if (timePeriod) {
        whereClause = 'WHERE "createdAt" >= $3 AND "createdAt" <= $4';
        params.push(timePeriod.start, timePeriod.end);
      }

      // Use pgvector's cosine similarity operator (<=>)
      // Lower distance means higher similarity
      const query = `
        SELECT 
          id,
          content,
          "createdAt",
          embedding <=> $1::vector AS distance
        FROM entries
        ${whereClause}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

      interface QueryResult {
        id: string;
        content: string;
        createdAt: Date;
        distance: number;
      }

      const results = await this.prisma.$queryRawUnsafe(query, ...params) as QueryResult[];

      // Convert results to EntryReference format
      return results.map((result: QueryResult) => ({
        entryId: result.id,
        date: result.createdAt,
        excerpt: this.extractExcerpt(result.content),
        relevanceScore: this.calculateRelevanceScore(result.distance)
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find similar entries: ${error.message}`);
      }
      throw new Error('Failed to find similar entries: Unknown error');
    }
  }

  /**
   * Extract a relevant excerpt from the entry content
   * Returns first 200 characters with word boundary preservation
   */
  private extractExcerpt(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Find the last space within the limit to avoid cutting words
    const truncated = content.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      // If we found a space reasonably close to the limit, use it
      return truncated.substring(0, lastSpaceIndex) + '...';
    } else {
      // Otherwise, just truncate at the limit
      return truncated + '...';
    }
  }

  /**
   * Calculate relevance score from cosine distance
   * Cosine distance ranges from 0 (identical) to 2 (opposite)
   * Convert to relevance score from 0 to 1 (higher is more relevant)
   */
  private calculateRelevanceScore(distance: number): number {
    // Clamp distance to reasonable range
    const clampedDistance = Math.max(0, Math.min(2, distance));
    
    // Convert distance to similarity score (1 - distance/2)
    // Distance 0 -> Score 1.0 (perfect match)
    // Distance 1 -> Score 0.5 (orthogonal)
    // Distance 2 -> Score 0.0 (opposite)
    const similarity = 1 - (clampedDistance / 2);
    
    // Round to 2 decimal places for cleaner output
    return Math.round(similarity * 100) / 100;
  }
}

// Factory function to create embedding service with dependencies
export function createEmbeddingService(
  llmService: LLMService,
  prisma: PrismaClient
): EmbeddingService {
  return new EmbeddingService({
    llmService,
    prisma
  });
}