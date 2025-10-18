import { GoogleGenerativeAI } from '@google/generative-ai';
import { TimePeriod } from '@/types';

export interface LLMServiceConfig {
  apiKey: string;
  model: string;
  embeddingModel: string;
}

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private embeddingModel: string;
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // 1 second

  constructor(config: LLMServiceConfig) {
    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
    this.embeddingModel = config.embeddingModel;
  }

  /**
   * Generate embedding for text using Gemini text-embedding-004
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    return this.withRetry(async () => {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
        const result = await model.embedContent(text);
        
        if (!result.embedding || !result.embedding.values) {
          throw new Error('Invalid embedding response from Gemini API');
        }
        
        return result.embedding.values;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to generate embedding: ${error.message}`);
        }
        throw new Error('Failed to generate embedding: Unknown error');
      }
    });
  }

  /**
   * Generate response using Gemini 2.5 Flash for chat completions
   */
  async generateResponse(prompt: string): Promise<string> {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    return this.withRetry(async () => {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt);
        
        if (!result.response) {
          throw new Error('No response received from Gemini API');
        }
        
        const text = result.response.text();
        if (!text) {
          throw new Error('Empty response received from Gemini API');
        }
        
        return text;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to generate response: ${error.message}`);
        }
        throw new Error('Failed to generate response: Unknown error');
      }
    });
  }

  /**
   * Extract time period from query using LLM
   */
  async extractTimePeriod(query: string): Promise<TimePeriod | null> {
    if (!query.trim()) {
      throw new Error('Query cannot be empty');
    }

    const prompt = `Extract the time period from this query. Return JSON with start and end dates.
If no specific time period is mentioned, return null.

Query: "${query}"

Examples:
- "What was I thinking in 2022?" → {"start": "2022-01-01", "end": "2022-12-31"}
- "How did I feel last month?" → {"start": "2024-09-01", "end": "2024-09-30"}
- "What would past me say?" → null

Return only valid JSON.`;

    return this.withRetry(async () => {
      try {
        const response = await this.generateResponse(prompt);
        
        // Clean the response to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          // If no JSON found, assume no time period was specified
          return null;
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        // If the response is null or doesn't have start/end, return null
        if (!parsed || !parsed.start || !parsed.end) {
          return null;
        }
        
        return {
          start: new Date(parsed.start),
          end: new Date(parsed.end)
        };
      } catch (error) {
        // If parsing fails, assume no time period was specified
        console.warn('Failed to parse time period from query:', error);
        return null;
      }
    });
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on certain types of errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === this.maxRetries - 1) {
          throw lastError;
        }
        
        // Wait before retrying with exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if an error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry on authentication errors, invalid input, etc.
    return (
      message.includes('api key') ||
      message.includes('authentication') ||
      message.includes('invalid') ||
      message.includes('cannot be empty')
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function to create LLM service with environment variables
export function createLLMService(): LLMService {
  const apiKey = process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
  
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }
  
  return new LLMService({
    apiKey,
    model,
    embeddingModel
  });
}