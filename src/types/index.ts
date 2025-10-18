// Core domain models
// Note: JournalEntry interface matches the Prisma Entry model (excluding embedding field)
export interface JournalEntry {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntryReference {
  entryId: string;
  date: Date;
  excerpt: string;
  relevanceScore: number;
}

export interface PastSelfQuery {
  query: string;
  timePeriod?: {
    start?: Date;
    end?: Date;
  };
  preset?: TimePeriodPreset;
}

export type TimePeriodPreset = 
  | '1-month-ago'
  | '3-months-ago' 
  | '6-months-ago'
  | '1-year-ago'
  | '2-years-ago'
  | '3-years-ago'
  | '5-years-ago'
  | '10-years-ago'
  | 'college-years'
  | 'high-school-years'
  | 'early-career'
  | 'last-decade';

export interface TimePeriodPresetConfig {
  id: TimePeriodPreset;
  label: string;
  description: string;
  calculateRange: (currentDate: Date) => { start: Date; end: Date };
}

export interface PastSelfResponse {
  response: string;
  references: EntryReference[];
  metadata: {
    entriesSearched: number;
    timePeriod: {
      start: Date;
      end: Date;
    };
    warning?: string;
  };
}

// API request/response types
export interface CreateEntryRequest {
  content: string;
  createdAt?: string;
}

export interface UpdateEntryRequest {
  content: string;
}

export interface GetEntriesQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  entries: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export interface TimePeriod {
  start: Date;
  end: Date;
}

export interface GetEntriesOptions {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}// Chat-re
lated types
export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
}

export interface PersonaRequest {
  timePeriod: {
    start: string;
    end: string;
  };
}

export interface PersonaResponse {
  personaPrompt: string;
  timePeriod: TimePeriod;
  entriesAnalyzed: number;
  summary: string;
}

export interface ChatRequest {
  message: string;
  timePeriod: {
    start: string;
    end: string;
  };
  personaPrompt: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  conversationHistory: ChatMessage[];
  metadata: {
    timePeriod: TimePeriod;
    relevantEntries: number;
    responseGenerated: string;
  };
}