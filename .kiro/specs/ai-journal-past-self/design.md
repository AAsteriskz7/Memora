# Design Document

## Overview

The AI Journal backend is built as a RESTful API using Next.js API routes with TypeScript. The system provides endpoints for CRUD operations on journal entries and a conversational interface for querying past-self memories. The backend uses PostgreSQL for data persistence and integrates with OpenAI's API for semantic search and response generation. The design prioritizes simplicity and clear API contracts to enable easy frontend integration.

## Architecture

### Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **LLM Provider**: Google Gemini 2.5 Flash (initial development, will migrate to Claude later)
- **Embeddings**: Gemini text-embedding-004
- **Vector Search**: pgvector extension for PostgreSQL

### System Components

```
┌─────────────────┐
│   Frontend      │
│   (Separate)    │
└────────┬────────┘
         │ HTTP/JSON
         ▼
┌─────────────────────────────────┐
│      Next.js API Routes         │
│  ┌──────────┐  ┌─────────────┐ │
│  │ Entries  │  │  Past-Self  │ │
│  │   API    │  │     API     │ │
│  └────┬─────┘  └──────┬──────┘ │
└───────┼────────────────┼────────┘
        │                │
        ▼                ▼
┌─────────────────────────────────┐
│      Business Logic Layer       │
│  ┌──────────┐  ┌─────────────┐ │
│  │  Entry   │  │  Past-Self  │ │
│  │ Service  │  │   Service   │ │
│  └────┬─────┘  └──────┬──────┘ │
└───────┼────────────────┼────────┘
        │                │
        ▼                ▼
┌─────────────────┐  ┌──────────────┐
│    Supabase     │  │  Gemini API  │
│  (PostgreSQL    │  │ (2.5 Flash)  │
│  + pgvector)    │  │              │
└─────────────────┘  └──────────────┘
```

## API Endpoints

### Journal Entry Endpoints

#### POST /api/entries
Create a new journal entry.

**Request Body:**
```json
{
  "content": "string (max 10000 chars)",
  "createdAt": "ISO 8601 datetime (optional, defaults to now)"
}
```

**Response (201):**
```json
{
  "id": "string (UUID)",
  "content": "string",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

#### GET /api/entries
Retrieve paginated list of journal entries.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)

**Response (200):**
```json
{
  "entries": [
    {
      "id": "string (UUID)",
      "content": "string",
      "createdAt": "ISO 8601 datetime",
      "updatedAt": "ISO 8601 datetime"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /api/entries/:id
Retrieve a specific journal entry by ID.

**Response (200):**
```json
{
  "id": "string (UUID)",
  "content": "string",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

#### PUT /api/entries/:id
Update an existing journal entry.

**Request Body:**
```json
{
  "content": "string (max 10000 chars)"
}
```

**Response (200):**
```json
{
  "id": "string (UUID)",
  "content": "string",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

#### DELETE /api/entries/:id
Delete a journal entry.

**Response (204):**
No content

### Past-Self Conversation Endpoint

#### POST /api/past-self/query
Query the past-self agent with a temporal question.

**Request Body:**
```json
{
  "query": "string",
  "timePeriod": {
    "start": "ISO 8601 date (optional)",
    "end": "ISO 8601 date (optional)"
  }
}
```

**Response (200):**
```json
{
  "response": "string",
  "references": [
    {
      "entryId": "string (UUID)",
      "date": "ISO 8601 datetime",
      "excerpt": "string",
      "relevanceScore": 0.95
    }
  ],
  "metadata": {
    "entriesSearched": 50,
    "timePeriod": {
      "start": "ISO 8601 date",
      "end": "ISO 8601 date"
    },
    "warning": "string (optional, e.g., 'Limited entries available')"
  }
}
```

**Error Response (400):**
```json
{
  "error": "No journal entries found. Please write your first entry to start conversations with your past self."
}
```

## Data Models

### Database Schema

```prisma
model Entry {
  id        String   @id @default(uuid())
  content   String   @db.Text
  embedding Float[]  @db.Vector(1536)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([createdAt])
}
```

### TypeScript Interfaces

```typescript
// Core domain models
interface JournalEntry {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EntryReference {
  entryId: string;
  date: Date;
  excerpt: string;
  relevanceScore: number;
}

interface PastSelfQuery {
  query: string;
  timePeriod?: {
    start?: Date;
    end?: Date;
  };
}

interface PastSelfResponse {
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
interface CreateEntryRequest {
  content: string;
  createdAt?: string;
}

interface UpdateEntryRequest {
  content: string;
}

interface GetEntriesQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface PaginatedResponse<T> {
  entries: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Components and Interfaces

### Service Layer

#### EntryService
Handles all journal entry operations.

```typescript
class EntryService {
  async createEntry(content: string, createdAt?: Date): Promise<JournalEntry>
  async getEntries(options: GetEntriesOptions): Promise<PaginatedResponse<JournalEntry>>
  async getEntryById(id: string): Promise<JournalEntry | null>
  async updateEntry(id: string, content: string): Promise<JournalEntry>
  async deleteEntry(id: string): Promise<void>
  async searchEntriesByDateRange(start: Date, end: Date): Promise<JournalEntry[]>
}
```

#### PastSelfService
Handles past-self conversation logic.

```typescript
class PastSelfService {
  async query(query: PastSelfQuery): Promise<PastSelfResponse>
  private async extractTimePeriod(query: string): Promise<TimePeriod>
  private async findRelevantEntries(query: string, timePeriod: TimePeriod): Promise<EntryReference[]>
  private async generateResponse(query: string, references: EntryReference[]): Promise<string>
}
```

#### EmbeddingService
Manages vector embeddings for semantic search.

```typescript
class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]>
  async findSimilarEntries(queryEmbedding: number[], limit: number, timePeriod?: TimePeriod): Promise<EntryReference[]>
}
```

#### LLMService
Interfaces with Gemini API (designed for easy migration to Claude later).

```typescript
class LLMService {
  async generateEmbedding(text: string): Promise<number[]>
  async generateResponse(prompt: string): Promise<string>
  async extractTimePeriod(query: string): Promise<TimePeriod | null>
}
```

## Past-Self Agent Implementation

### Semantic Search Flow

1. **Query Processing**
   - Extract temporal information from user query using LLM
   - If no time period specified, search all entries
   - Generate embedding for the query text

2. **Entry Retrieval**
   - Use pgvector cosine similarity search on embeddings
   - Filter by extracted time period
   - Retrieve top 5 most relevant entries
   - Calculate relevance scores

3. **Response Generation**
   - Construct prompt with query and relevant entry excerpts
   - Include temporal context in prompt
   - Generate response using Gemini 2.5 Flash
   - Ensure response reflects past perspective

4. **Reference Assembly**
   - Extract relevant excerpts from source entries
   - Include entry metadata (date, ID)
   - Return references with response

### LLM Prompt Templates

#### Time Period Extraction Prompt
```
Extract the time period from this query. Return JSON with start and end dates.
If no specific time period is mentioned, return null.

Query: "{user_query}"

Examples:
- "What was I thinking in 2022?" → {"start": "2022-01-01", "end": "2022-12-31"}
- "How did I feel last month?" → {"start": "2024-09-01", "end": "2024-09-30"}
- "What would past me say?" → null

Return only valid JSON.
```

#### Response Generation Prompt
```
You are responding as the user's past self based on their journal entries from {time_period}.

User's question: "{query}"

Relevant journal entries from that time:
{entry_excerpts}

Instructions:
- Respond as if you are the person who wrote these entries
- Use only information from the provided entries
- Reflect the thoughts, feelings, and perspective from that time period
- Do not use knowledge or perspectives from after {end_date}
- Be conversational and authentic
- If the entries don't contain enough information, acknowledge the limitation

Response:
```

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}
```

### Common Error Scenarios

1. **No Entries Available** (400)
   - User has no journal entries
   - Return helpful message prompting first entry

2. **No Relevant Entries** (200)
   - Query returns no matches
   - Return response indicating no entries found for period
   - Suggest writing more entries

3. **Invalid Time Period** (400)
   - Malformed date parameters
   - Return validation error

4. **Entry Not Found** (404)
   - Requested entry ID doesn't exist
   - Return 404 with clear message

5. **LLM API Failure** (503)
   - Gemini API unavailable or rate limited
   - Return service unavailable error
   - Implement retry logic with exponential backoff

6. **Database Connection Error** (500)
   - Database unavailable
   - Return generic server error
   - Log detailed error for debugging

## Testing Strategy

### Unit Tests
- Service layer methods
- Utility functions (date parsing, text extraction)
- Prompt template generation
- Error handling logic

### Integration Tests
- API endpoint responses
- Database operations with test database
- LLM service mocking for consistent tests

### End-to-End Tests
- Complete user flows (create entry → query past self)
- Edge cases (no entries, invalid dates)
- Pagination and filtering

### Test Data
- Seed database with sample journal entries
- Cover various time periods
- Include entries with different content lengths and topics

## Environment Configuration

### Required Environment Variables

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres

# LLM Provider
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Embeddings (using Gemini's embedding model)
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Application
NODE_ENV=development
PORT=3000
```

## Database Setup

### Supabase Setup

1. **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project
   - Copy connection string from Settings > Database

2. **Enable pgvector** (Already enabled in Supabase)
   - pgvector extension is pre-installed
   - No manual setup required

3. **Prisma Migration**
   ```sql
   -- Prisma will handle table creation
   -- pgvector is already available
   ```

### Embedding Generation Strategy

- Generate embeddings on entry creation/update
- Store embeddings in database alongside content
- Use batch processing for initial data migration
- Implement queue for async embedding generation if needed

## Performance Considerations

### Caching Strategy
- Cache frequently accessed entries in memory
- Cache embedding results for common queries
- Use Redis for distributed caching if scaling needed

### Database Optimization
- Index on createdAt for date range queries
- Vector index for similarity search
- Pagination to limit result sets
- Connection pooling for database connections

### LLM API Optimization
- Batch embedding generation when possible
- Implement request queuing to avoid rate limits
- Cache embeddings to minimize API calls
- Use streaming responses for long-running queries

## Frontend Integration Guide

### Getting Started

1. **Base URL**: All API endpoints are prefixed with `/api`
2. **Content Type**: All requests/responses use `application/json`
3. **Date Format**: ISO 8601 strings (e.g., `2024-10-17T10:30:00Z`)

### Example Usage

#### Creating an Entry
```typescript
const response = await fetch('/api/entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Today was a great day...'
  })
});
const entry = await response.json();
```

#### Querying Past Self
```typescript
const response = await fetch('/api/past-self/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What was I thinking about my career in 2023?',
    timePeriod: {
      start: '2023-01-01',
      end: '2023-12-31'
    }
  })
});
const result = await response.json();
console.log(result.response); // Past-self response
console.log(result.references); // Source entries
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/entries');
  if (!response.ok) {
    const error = await response.json();
    console.error(error.error);
  }
  const data = await response.json();
} catch (err) {
  console.error('Network error:', err);
}
```

## Security Considerations

### Input Validation
- Sanitize all user input
- Validate content length limits
- Validate date formats
- Prevent SQL injection via Prisma ORM

### API Security
- Rate limiting on all endpoints
- Request size limits
- CORS configuration for frontend domain
- Environment variable protection

### Data Privacy
- No authentication in MVP (single user)
- Future: Add user authentication and data isolation
- Secure database connections
- API key protection in environment variables
