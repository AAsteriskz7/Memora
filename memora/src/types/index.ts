// Core domain models
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
  details?: any;
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
}