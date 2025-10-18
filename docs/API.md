# AI Journal API Documentation

## Overview

The AI Journal API provides endpoints for managing journal entries and conversing with past versions of yourself through your historical entries. The API is built with Next.js 14 and TypeScript, using RESTful principles.

**Base URL:** `http://localhost:3000/api`

**Content Type:** All requests and responses use `application/json`

**Date Format:** ISO 8601 strings (e.g., `2024-10-17T10:30:00Z`)

## Authentication

Currently, no authentication is required (single-user MVP).

## Rate Limiting

- Standard rate limiting applies to all endpoints
- Past-self queries may have additional AI service rate limits
- Rate limit exceeded responses return HTTP 429

## Error Handling

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `DATABASE_ERROR` - Database connection issues
- `AI_SERVICE_ERROR` - AI service unavailable
- `RATE_LIMIT_ERROR` - Rate limit exceeded
- `INTERNAL_ERROR` - Unexpected server error

## Endpoints

### Journal Entries

#### Create Entry

**POST** `/api/entries`

Create a new journal entry with automatic embedding generation for semantic search.

**Request Body:**
```json
{
  "content": "Today was a great day. I learned something new about React hooks...",
  "createdAt": "2024-10-17T10:30:00Z"
}
```

**Parameters:**
- `content` (string, required): Entry content (1-10,000 characters)
- `createdAt` (string, optional): ISO 8601 date. Defaults to current time. Cannot be in the future.

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Today was a great day. I learned something new about React hooks...",
  "createdAt": "2024-10-17T10:30:00.000Z",
  "updatedAt": "2024-10-17T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Invalid content, missing required fields, or future date
- `503` - Database or AI service unavailable
- `500` - Internal server error

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Had an amazing breakthrough with the new project today. The solution came to me while walking."
  }'
```

---

#### Get Entries

**GET** `/api/entries`

Retrieve a paginated list of journal entries, sorted by creation date (newest first).

**Query Parameters:**
- `page` (number, optional): Page number (default: 1, min: 1)
- `limit` (number, optional): Items per page (default: 20, min: 1, max: 100)
- `startDate` (string, optional): ISO 8601 date to filter entries from
- `endDate` (string, optional): ISO 8601 date to filter entries until

**Success Response (200):**
```json
{
  "entries": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Today was a great day...",
      "createdAt": "2024-10-17T10:30:00.000Z",
      "updatedAt": "2024-10-17T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Responses:**
- `400` - Invalid pagination parameters or date format
- `503` - Database unavailable
- `500` - Internal server error

**Example Requests:**
```bash
# Get first page with default limit
curl http://localhost:3000/api/entries

# Get entries from specific date range
curl "http://localhost:3000/api/entries?startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50"
```

---

#### Get Entry by ID

**GET** `/api/entries/{id}`

Retrieve a specific journal entry by its unique identifier.

**Path Parameters:**
- `id` (string, required): Entry UUID

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Today was a great day...",
  "createdAt": "2024-10-17T10:30:00.000Z",
  "updatedAt": "2024-10-17T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Invalid or missing entry ID
- `404` - Entry not found
- `503` - Database unavailable
- `500` - Internal server error

**Example Request:**
```bash
curl http://localhost:3000/api/entries/550e8400-e29b-41d4-a716-446655440000
```

---

#### Update Entry

**PUT** `/api/entries/{id}`

Update an existing journal entry. The embedding will be automatically regenerated for semantic search.

**Path Parameters:**
- `id` (string, required): Entry UUID

**Request Body:**
```json
{
  "content": "Updated content for the journal entry..."
}
```

**Parameters:**
- `content` (string, required): New entry content (1-10,000 characters)

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Updated content for the journal entry...",
  "createdAt": "2024-10-17T10:30:00.000Z",
  "updatedAt": "2024-10-17T11:45:00.000Z"
}
```

**Error Responses:**
- `400` - Invalid content or entry ID
- `404` - Entry not found
- `503` - Database or AI service unavailable
- `500` - Internal server error

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/entries/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated: Today was an even better day after I reflected on it more."
  }'
```

---

#### Delete Entry

**DELETE** `/api/entries/{id}`

Permanently delete a journal entry. This will also remove it from past-self conversation context.

**Path Parameters:**
- `id` (string, required): Entry UUID

**Success Response (204):**
No content returned.

**Error Responses:**
- `400` - Invalid or missing entry ID
- `404` - Entry not found
- `503` - Database unavailable
- `500` - Internal server error

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/entries/550e8400-e29b-41d4-a716-446655440000
```

---

### Past-Self Conversations

#### Query Past Self

**POST** `/api/past-self/query`

Ask a question to your past self from a specific time period. The system will find relevant journal entries and generate a response as if your past self wrote it.

**Request Body:**
```json
{
  "query": "What was I thinking about my career in 2023?",
  "timePeriod": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2023-12-31T23:59:59Z"
  }
}
```

**Alternative with Preset:**
```json
{
  "query": "How did I feel about relationships back then?",
  "preset": "college-years"
}
```

**Parameters:**
- `query` (string, required): Your question to past self (1-1,000 characters)
- `timePeriod` (object, optional): Specific date range
  - `start` (string, optional): ISO 8601 start date
  - `end` (string, optional): ISO 8601 end date
- `preset` (string, optional): Predefined time period (see presets below)

**Note:** You can specify either `timePeriod` OR `preset`, but not both.

**Success Response (200):**
```json
{
  "response": "Back in 2023, I was really excited about the new opportunities in tech. I remember feeling uncertain but optimistic about making a career change...",
  "references": [
    {
      "entryId": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2023-03-15T10:30:00.000Z",
      "excerpt": "I've been thinking a lot about switching careers lately. The tech industry seems so dynamic...",
      "relevanceScore": 0.95
    },
    {
      "entryId": "660e8400-e29b-41d4-a716-446655440001",
      "date": "2023-07-22T14:20:00.000Z",
      "excerpt": "Had that interview today. I think it went well, but I'm nervous about the technical aspects...",
      "relevanceScore": 0.87
    }
  ],
  "metadata": {
    "entriesSearched": 45,
    "timePeriod": {
      "start": "2023-01-01T00:00:00.000Z",
      "end": "2023-12-31T23:59:59.000Z"
    },
    "warning": "Limited entries available for this time period"
  }
}
```

**Error Responses:**
- `400` - Invalid query, malformed dates, or no entries found
- `429` - AI service rate limit exceeded
- `503` - Database or AI service unavailable
- `500` - Internal server error

**Special Error Cases:**
```json
{
  "error": "No journal entries found. Please write your first entry to start conversations with your past self.",
  "code": "NO_ENTRIES"
}
```

**Example Requests:**
```bash
# Query with specific time period
curl -X POST http://localhost:3000/api/past-self/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What was I worried about during my job search?",
    "timePeriod": {
      "start": "2023-01-01T00:00:00Z",
      "end": "2023-06-30T23:59:59Z"
    }
  }'

# Query with preset
curl -X POST http://localhost:3000/api/past-self/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How did I feel about my studies?",
    "preset": "college-years"
  }'
```

---

## Time Period Presets

The following presets are available for past-self queries:

### Relative Presets
- `1-month-ago` - 1 month ago from current date
- `3-months-ago` - 3 months ago from current date
- `6-months-ago` - 6 months ago from current date
- `1-year-ago` - 1 year ago from current date
- `2-years-ago` - 2 years ago from current date
- `3-years-ago` - 3 years ago from current date
- `5-years-ago` - 5 years ago from current date
- `10-years-ago` - 10 years ago from current date

### Contextual Presets
- `college-years` - Typical college age (18-22 years old)
- `high-school-years` - Typical high school age (14-18 years old)
- `early-career` - First 5 years of professional career
- `last-decade` - Last 10 years from current date

**Example Preset Usage:**
```json
{
  "query": "What were my biggest concerns back then?",
  "preset": "college-years"
}
```

---

## Data Models

### JournalEntry
```typescript
{
  id: string;           // UUID
  content: string;      // Entry text (1-10,000 chars)
  createdAt: Date;      // ISO 8601 timestamp
  updatedAt: Date;      // ISO 8601 timestamp
}
```

### EntryReference
```typescript
{
  entryId: string;      // UUID of referenced entry
  date: Date;           // ISO 8601 timestamp
  excerpt: string;      // Relevant text excerpt
  relevanceScore: number; // 0.0 to 1.0 similarity score
}
```

### PaginatedResponse
```typescript
{
  entries: JournalEntry[];
  pagination: {
    page: number;       // Current page
    limit: number;      // Items per page
    total: number;      // Total items
    totalPages: number; // Total pages
  };
}
```

---

## Usage Examples

### Complete Workflow Example

```javascript
// 1. Create a journal entry
const createResponse = await fetch('/api/entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Today I started learning about machine learning. It feels overwhelming but exciting.'
  })
});
const newEntry = await createResponse.json();

// 2. Get all entries
const entriesResponse = await fetch('/api/entries?page=1&limit=10');
const entriesData = await entriesResponse.json();

// 3. Query past self (after having multiple entries)
const queryResponse = await fetch('/api/past-self/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What did I think about learning new technologies?',
    preset: '1-year-ago'
  })
});
const pastSelfResponse = await queryResponse.json();

// 4. Update an entry
const updateResponse = await fetch(`/api/entries/${newEntry.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Updated: Today I started learning about machine learning. After a few hours, it\'s starting to make sense!'
  })
});
const updatedEntry = await updateResponse.json();
```

### Error Handling Example

```javascript
async function createEntry(content) {
  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (error.code) {
        case 'VALIDATION_ERROR':
          console.error('Invalid input:', error.error);
          break;
        case 'DATABASE_ERROR':
          console.error('Database issue:', error.error);
          break;
        default:
          console.error('Unexpected error:', error.error);
      }
      
      throw new Error(error.error);
    }

    return await response.json();
  } catch (err) {
    console.error('Network error:', err);
    throw err;
  }
}
```

---

## Testing

### Test Data

The system includes a demo data generation script that creates realistic journal entries for testing:

```bash
npm run generate-demo-data
```

This creates 700+ diverse entries spanning multiple years with varied topics and emotional tones.

### API Testing

You can test the API using the provided integration tests:

```bash
npm test
```

Or test individual endpoints manually using the examples above.

---

## Troubleshooting

### Common Issues

1. **"No journal entries found" error**
   - Solution: Create some journal entries first using POST `/api/entries`

2. **"AI service temporarily unavailable" error**
   - Solution: Check your `GOOGLE_API_KEY` environment variable
   - Wait a few minutes if rate limited

3. **"Database connection error"**
   - Solution: Check your `DATABASE_URL` environment variable
   - Ensure Supabase database is running

4. **Invalid date format errors**
   - Solution: Use ISO 8601 format: `2024-10-17T10:30:00Z`

### Environment Variables

Ensure these are set in your `.env` file:

```env
DATABASE_URL=postgresql://...
GOOGLE_API_KEY=your_api_key_here
```

---

## Changelog

### Version 1.0.0
- Initial API release
- Journal entry CRUD operations
- Past-self conversation queries
- Time period presets
- Semantic search with embeddings