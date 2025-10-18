import { PrismaClient } from '@prisma/client';
import { LLMService } from './llm.service';
import { EmbeddingService } from './embedding.service';
import { TimePeriodPresets } from '@/utils';
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

      // Step 2: Resolve time period from preset, explicit period, or query extraction
      let timePeriod: TimePeriod | undefined;
      
      if (query.preset) {
        // Use preset to calculate time period
        timePeriod = this.resolvePresetTimePeriod(query.preset);
      } else if (query.timePeriod?.start && query.timePeriod?.end) {
        // Use explicitly provided time period
        timePeriod = {
          start: query.timePeriod.start,
          end: query.timePeriod.end
        };
      } else {
        // Extract time period from query text using LLM
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
   * Resolve preset to time period using TimePeriodPresets utility
   */
  private resolvePresetTimePeriod(preset: string): TimePeriod {
    try {
      if (!TimePeriodPresets.isValidPreset(preset)) {
        throw new Error(`Invalid time period preset: ${preset}`);
      }
      
      return TimePeriodPresets.presetToDateRange(preset);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to resolve preset '${preset}': ${error.message}`);
      }
      throw new Error(`Failed to resolve preset '${preset}': Unknown error`);
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
   * For past-self conversations, we search entries from the target time period
   * AND entries from before that period (for context/memories)
   */
  private async findRelevantEntries(
    query: string, 
    timePeriod?: TimePeriod
  ): Promise<EntryReference[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      if (timePeriod) {
        // For past-self conversations, we want entries from:
        // 1. The target time period (primary context)
        // 2. Before the target time period (accessible memories)
        // But NEVER after the target time period (future knowledge)
        
        const pastSelfTimePeriod: TimePeriod = {
          start: new Date(0), // Beginning of time (all past memories)
          end: timePeriod.end  // Up to the end of the target period
        };
        
        // Find similar entries with past-self time filtering
        const similarEntries = await this.embeddingService.findSimilarEntries(
          queryEmbedding,
          8, // Get more entries to have better context
          pastSelfTimePeriod
        );

        // Prioritize entries from the target period, but include earlier ones for context
        const targetPeriodEntries = similarEntries.filter(entry => 
          entry.date >= timePeriod.start && entry.date <= timePeriod.end
        );
        
        const earlierEntries = similarEntries.filter(entry => 
          entry.date < timePeriod.start
        );

        // FOCUS on target period first, then add earlier context if needed
        // Priority: 4 from target period, 1 from earlier for context
        const selectedEntries = [
          ...targetPeriodEntries.slice(0, 4), // Primary focus on target period
          ...earlierEntries.slice(0, 1)       // Minimal earlier context
        ];

        return selectedEntries.slice(0, 5); // Limit total to 5
      } else {
        // No specific time period - find similar entries from all time
        const similarEntries = await this.embeddingService.findSimilarEntries(
          queryEmbedding,
          5,
          timePeriod
        );

        return similarEntries;
      }
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

    // Separate entries by time period for better context
    const targetPeriodEntries = timePeriod 
      ? references.filter(ref => ref.date >= timePeriod.start && ref.date <= timePeriod.end)
      : references;
    
    const earlierEntries = timePeriod 
      ? references.filter(ref => ref.date < timePeriod.start)
      : [];

    const targetEntriesText = targetPeriodEntries.length > 0
      ? targetPeriodEntries
          .map((ref, index) => `Entry ${index + 1} (${ref.date.toLocaleDateString()}):\n"${ref.excerpt}"`)
          .join('\n\n')
      : 'No entries from this specific time period.';

    const earlierEntriesText = earlierEntries.length > 0
      ? earlierEntries
          .map((ref, index) => `Memory ${index + 1} (${ref.date.toLocaleDateString()}):\n"${ref.excerpt}"`)
          .join('\n\n')
      : '';

    const contextSection = earlierEntries.length > 0 
      ? `\n\nBackground context from earlier memories (for reference only):\n${earlierEntriesText}`
      : '';

    const prompt = `You are responding as the user's past self from ${timePeriodText}. You are speaking from the perspective of that specific time period.

User's question: "${query}"

PRIMARY FOCUS - My journal entries from ${timePeriodText}:
${targetEntriesText}${contextSection}

CRITICAL INSTRUCTIONS:
- You are speaking as your past self from ${timePeriod?.end.toLocaleDateString() || 'that time'}
- FOCUS PRIMARILY on the entries from ${timePeriodText} - this is your main context
- Earlier memories are only background context - use sparingly and only if directly relevant
- You can only know what you knew up until ${timePeriod?.end.toLocaleDateString() || 'that time'}
- You have NO knowledge of events after ${timePeriod?.end.toLocaleDateString() || 'that time'}
- Use the thoughts, feelings, and perspective you had during ${timePeriodText}
- Speak in present tense as if you are currently living in ${timePeriodText}
- Be authentic to who you were at that time - your concerns, hopes, and understanding
- Base your response primarily on the entries from ${timePeriodText}
- Keep your response conversational and personal (2-3 paragraphs maximum)

Response as your past self:`;

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
   * Get preset suggestions based on a query string
   * This can be used by the API to suggest relevant presets to users
   */
  getPresetSuggestions(query: string) {
    return TimePeriodPresets.suggestPresets(query);
  }

  /**
   * Get all available time period presets
   * This can be used by the API to show all available presets to users
   */
  getAllPresets() {
    return TimePeriodPresets.getAllPresets();
  }

  /**
   * Get relative presets (time-based like "1-year-ago")
   */
  getRelativePresets() {
    return TimePeriodPresets.getRelativePresets();
  }

  /**
   * Get contextual presets (life-stage based like "college-years")
   */
  getContextualPresets() {
    return TimePeriodPresets.getContextualPresets();
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