import { PrismaClient } from '@prisma/client';
import { LLMService } from './llm.service';
import { EmbeddingService } from './embedding.service';
import { 
  PastSelfQuery, 
  PastSelfResponse, 
  EntryReference, 
  TimePeriod 
} from '@/types';

export interface PastSelfServiceConfig {
  llmService: LLMService;
  embeddingService: EmbeddingService;
  prisma: PrismaClient;
}

export class PastSelfService {
  private llmService: LLMService;
  private embeddingService: EmbeddingService;
  private prisma: PrismaClient;

  constructor(config: PastSelfServiceConfig) {
    this.llmService = config.llmService;
    this.embeddingService = config.embeddingService;
    this.prisma = config.prisma;
  }

  /**
   * Main query method that orchestrates the full past-self conversation flow
   */
  async query(query: PastSelfQuery): Promise<PastSelfResponse> {
    if (!query.query.trim()) {
      throw new Error('Query cannot be empty');
    }

    try {
      // Step 1: Check if user has any entries at all
      const totalEntries = await this.prisma.entry.count();
      if (totalEntries === 0) {
        throw new Error('No journal entries found. Please write your first entry to start conversations with your past self.');
      }

      // Step 2: Extract time period from query if not provided
      let timePeriod: TimePeriod | undefined;
      if (query.timePeriod?.start && query.timePeriod?.end) {
        timePeriod = {
          start: query.timePeriod.start,
          end: query.timePeriod.end
        };
      } else {
        timePeriod = await this.extractTimePeriod(query.query);
      }

      // Step 3: Find relevant entries using semantic search
      const relevantEntries = await this.findRelevantEntries(query.query, timePeriod);

      // Step 4: Handle limited entry scenarios
      const metadata = await this.buildMetadata(timePeriod, totalEntries, relevantEntries.length);

      // Step 5: Generate response from past-self perspective
      const response = await this.generateResponse(query.query, relevantEntries, timePeriod);

      return {
        response,
        references: relevantEntries,
        metadata
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to process past-self query: Unknown error');
    }
  }

  /**
   * Extract time period from query using LLM service
   */
  private async extractTimePeriod(query: string): Promise<TimePeriod | undefined> {
    try {
      return await this.llmService.extractTimePeriod(query) || undefined;
    } catch (error) {
      // If time period extraction fails, continue without time filtering
      console.warn('Failed to extract time period from query:', error);
      return undefined;
    }
  }

  /**
   * Find relevant entries using embedding service
   */
  private async findRelevantEntries(
    query: string, 
    timePeriod?: TimePeriod
  ): Promise<EntryReference[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      // Find similar entries with optional time filtering
      const similarEntries = await this.embeddingService.findSimilarEntries(
        queryEmbedding,
        5, // Limit to top 5 most relevant entries
        timePeriod
      );

      return similarEntries;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find relevant entries: ${error.message}`);
      }
      throw new Error('Failed to find relevant entries: Unknown error');
    }
  }

  /**
   * Generate response with proper prompt construction
   */
  private async generateResponse(
    query: string,
    references: EntryReference[],
    timePeriod?: TimePeriod
  ): Promise<string> {
    // Handle case where no relevant entries were found
    if (references.length === 0) {
      if (timePeriod) {
        const startDate = timePeriod.start.toLocaleDateString();
        const endDate = timePeriod.end.toLocaleDateString();
        return `I don't have any journal entries from ${startDate} to ${endDate} that relate to your question. Try asking about a different time period or write more entries to build up your journal history.`;
      } else {
        return `I don't have any journal entries that relate to your question. Try writing more entries about your thoughts and experiences to build up your journal history.`;
      }
    }

    // Build the prompt with context and instructions
    const timePeriodText = timePeriod 
      ? `${timePeriod.start.toLocaleDateString()} to ${timePeriod.end.toLocaleDateString()}`
      : 'your past';

    const entryExcerpts = references
      .map((ref, index) => `Entry ${index + 1} (${ref.date.toLocaleDateString()}):\n"${ref.excerpt}"`)
      .join('\n\n');

    const prompt = `You are responding as the user's past self based on their journal entries from ${timePeriodText}.

User's question: "${query}"

Relevant journal entries from that time:
${entryExcerpts}

Instructions:
- Respond as if you are the person who wrote these entries
- Use only information from the provided entries
- Reflect the thoughts, feelings, and perspective from that time period
- Do not use knowledge or perspectives from after ${timePeriod?.end.toLocaleDateString() || 'the time these entries were written'}
- Be conversational and authentic
- If the entries don't contain enough information, acknowledge the limitation
- Keep your response concise but meaningful (2-3 paragraphs maximum)

Response:`;

    try {
      return await this.llmService.generateResponse(prompt);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate past-self response: ${error.message}`);
      }
      throw new Error('Failed to generate past-self response: Unknown error');
    }
  }

  /**
   * Build metadata for the response including warnings for limited entries
   */
  private async buildMetadata(
    timePeriod: TimePeriod | undefined,
    totalEntries: number,
    relevantEntriesFound: number
  ): Promise<PastSelfResponse['metadata']> {
    // Calculate the actual time period searched
    let searchTimePeriod: { start: Date; end: Date };
    
    if (timePeriod) {
      searchTimePeriod = timePeriod;
    } else {
      // If no time period specified, get the range of all entries
      const oldestEntry = await this.prisma.entry.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      });
      
      const newestEntry = await this.prisma.entry.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      searchTimePeriod = {
        start: oldestEntry?.createdAt || new Date(),
        end: newestEntry?.createdAt || new Date()
      };
    }

    // Count entries in the search period
    const entriesInPeriod = await this.prisma.entry.count({
      where: timePeriod ? {
        createdAt: {
          gte: timePeriod.start,
          lte: timePeriod.end
        }
      } : undefined
    });

    // Generate warning message for limited entries
    let warning: string | undefined;
    
    if (totalEntries < 5) {
      warning = `You have ${totalEntries} journal entries. Responses will improve as you write more entries about your thoughts and experiences.`;
    } else if (entriesInPeriod === 0) {
      const startDate = searchTimePeriod.start.toLocaleDateString();
      const endDate = searchTimePeriod.end.toLocaleDateString();
      warning = `No entries found for the period ${startDate} to ${endDate}. Try a different time period or write more entries.`;
    } else if (relevantEntriesFound === 0) {
      warning = 'No relevant entries found for your question. Try asking about different topics or write more entries.';
    }

    return {
      entriesSearched: entriesInPeriod,
      timePeriod: searchTimePeriod,
      warning
    };
  }
}

// Factory function to create past-self service with dependencies
export function createPastSelfService(
  llmService: LLMService,
  embeddingService: EmbeddingService,
  prisma: PrismaClient
): PastSelfService {
  return new PastSelfService({
    llmService,
    embeddingService,
    prisma
  });
}