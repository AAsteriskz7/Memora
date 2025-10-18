# API Integration Testing Guide

This document describes the API integration tests for the AI Journal system.

## Overview

The API integration tests validate all REST API endpoints by making real HTTP requests to a running development server. Tests cover:

- **Entry Management**: Create, read, update, and delete journal entries
- **Pagination & Filtering**: Query entries with various parameters
- **Validation**: Ensure proper error handling for invalid inputs
- **Past-Self Queries**: Test the conversational AI endpoint (pending implementation)

## Test File Location

- **Test Suite**: `src/tests/api-integration.test.ts`
- **Test Documentation**: `src/tests/README.md`

## Prerequisites

### 1. Database Setup

Ensure your database is configured and migrated:

```bash
# Configure DATABASE_URL in .env file
# Example: DATABASE_URL=postgresql://user:password@host:5432/database

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 2. Environment Variables

Required variables in `.env`:

```env
DATABASE_URL=postgresql://...
GOOGLE_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

### 3. Development Server

Start the Next.js development server:

```bash
npm run dev
```

The server should be running at `http://localhost:3000`

## Running Tests

### Quick Start

```bash
npm run test:api
```

### Manual Execution

```bash
npx tsx src/tests/api-integration.test.ts
```

### With Custom Base URL

```bash
BASE_URL=http://localhost:3001 npm run test:api
```

## Test Coverage

### ✅ POST /api/entries (8 tests)

Tests for creating journal entries:

1. ✅ Create entry with valid content
2. ✅ Create entry with custom createdAt
3. ✅ Reject empty content
4. ✅ Reject content over 10,000 characters
5. ✅ Reject missing content field
6. ✅ Reject invalid createdAt format
7. ✅ Reject future createdAt dates
8. ✅ Reject invalid JSON in request body

**Example Request:**
```json
POST /api/entries
{
  "content": "Today was a great day!",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Expected Response (201):**
```json
{
  "id": "uuid",
  "content": "Today was a great day!",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### ✅ GET /api/entries (7 tests)

Tests for retrieving paginated entries:

1. ✅ Get entries with default pagination (page=1, limit=20)
2. ✅ Get entries with custom pagination
3. ✅ Get entries with date range filtering
4. ✅ Reject invalid page parameter (page < 1)
5. ✅ Reject invalid limit parameter (limit > 100)
6. ✅ Reject invalid date formats
7. ✅ Reject startDate after endDate

**Example Request:**
```
GET /api/entries?page=1&limit=10&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z
```

**Expected Response (200):**
```json
{
  "entries": [
    {
      "id": "uuid",
      "content": "Entry content...",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### ✅ GET /api/entries/[id] (3 tests)

Tests for retrieving a single entry:

1. ✅ Get entry by valid UUID
2. ✅ Return 404 for non-existent ID
3. ✅ Handle empty or invalid ID

**Example Request:**
```
GET /api/entries/123e4567-e89b-12d3-a456-426614174000
```

**Expected Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Entry content...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### ✅ PUT /api/entries/[id] (5 tests)

Tests for updating entries:

1. ✅ Update entry with valid content
2. ✅ Return 404 for non-existent ID
3. ✅ Reject empty content
4. ✅ Reject content over 10,000 characters
5. ✅ Reject missing content field

**Example Request:**
```json
PUT /api/entries/123e4567-e89b-12d3-a456-426614174000
{
  "content": "Updated entry content"
}
```

**Expected Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Updated entry content",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### ✅ DELETE /api/entries/[id] (3 tests)

Tests for deleting entries:

1. ✅ Delete entry with valid ID
2. ✅ Verify entry was deleted (subsequent GET returns 404)
3. ✅ Return 404 for non-existent ID

**Example Request:**
```
DELETE /api/entries/123e4567-e89b-12d3-a456-426614174000
```

**Expected Response (204):**
```
No content
```

### ⏳ POST /api/past-self/query (5 tests - Pending Implementation)

Tests for querying past-self (requires Task 16 implementation):

1. ⏳ Query with specific time period
2. ⏳ Query without time period (searches all entries)
3. ⏳ Reject empty query
4. ⏳ Handle no entries scenario
5. ⏳ Handle no relevant entries for time period

**Example Request:**
```json
POST /api/past-self/query
{
  "query": "What was I thinking about my career in 2023?",
  "timePeriod": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2023-12-31T23:59:59Z"
  }
}
```

**Expected Response (200):**
```json
{
  "response": "Based on your entries from 2023, you were...",
  "references": [
    {
      "entryId": "uuid",
      "date": "2023-06-15T10:30:00.000Z",
      "excerpt": "Relevant excerpt from entry...",
      "relevanceScore": 0.95
    }
  ],
  "metadata": {
    "entriesSearched": 50,
    "timePeriod": {
      "start": "2023-01-01T00:00:00.000Z",
      "end": "2023-12-31T23:59:59.000Z"
    }
  }
}
```

## Test Output

### Success Output

```
🚀 Starting API Integration Tests
==================================================
Base URL: http://localhost:3000
Timeout: 30000ms

🔌 Checking database connection...
✅ Database connection successful

📝 Testing POST /api/entries
==================================================
✅ Create entry with valid content
✅ Create entry with custom createdAt
✅ Reject empty content
...

==================================================
📊 Test Summary
==================================================
Total Tests: 31
✅ Passed: 31
❌ Failed: 0
Success Rate: 100.0%

🧹 Cleaning up test data...
✅ Cleaned up 5 test entries
```

### Failure Output

```
❌ Create entry with valid content
   Error: Database connection error

==================================================
📊 Test Summary
==================================================
Total Tests: 31
✅ Passed: 26
❌ Failed: 5
Success Rate: 83.9%

❌ Failed Tests:
   - Create entry with valid content: Database connection error
   - Update entry with valid content: Entry not found
   ...
```

## Test Data Management

### Automatic Cleanup

The test suite automatically:
- Tracks all created entries during test execution
- Cleans up test entries after all tests complete
- Ensures no test data pollution in the database

### Manual Cleanup

If tests are interrupted, you can manually clean up:

```sql
-- Connect to your database and run:
DELETE FROM entries WHERE content LIKE '%test%' OR content LIKE '%Test%';
```

## Troubleshooting

### Server Not Running

```
❌ Error: Cannot connect to server
   Make sure the server is running: npm run dev
```

**Solution**: Start the development server in a separate terminal.

### Database Connection Failed

```
❌ Database connection failed
   Make sure:
   1. DATABASE_URL is configured in .env
   2. Database migrations are run: npm run db:migrate
   3. Database server is accessible
```

**Solution**: 
1. Check `.env` file has correct `DATABASE_URL`
2. Run `npm run db:migrate`
3. Verify database server is running

### API Key Not Configured

Some tests may fail if `GOOGLE_API_KEY` is not set. The tests will skip API-dependent operations gracefully.

**Solution**: Add `GOOGLE_API_KEY` to your `.env` file.

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
PORT=3001 npm run dev

# Then run tests with custom URL
BASE_URL=http://localhost:3001 npm run test:api
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: |
          npm run db:generate
          npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Start server
        run: npm run dev &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run tests
        run: npm run test:api
```

## Best Practices

### When Writing New Tests

1. **Follow the existing pattern**: Use the `logTest()` helper function
2. **Clean up test data**: Add created entry IDs to `createdEntryIds` array
3. **Test both success and failure cases**: Validate error responses
4. **Use descriptive test names**: Make failures easy to understand
5. **Test edge cases**: Empty strings, max lengths, invalid formats

### When Modifying APIs

1. **Update tests first**: Add tests for new functionality
2. **Run tests locally**: Verify all tests pass before committing
3. **Update documentation**: Keep this file in sync with test changes
4. **Check error messages**: Ensure error responses are helpful

## Related Documentation

- [API Design Document](./design.md) - API endpoint specifications
- [Requirements Document](./requirements.md) - Feature requirements
- [Test README](./src/tests/README.md) - Quick test reference

## Summary

The API integration test suite provides comprehensive coverage of all implemented endpoints with:

- **31 total tests** (26 for implemented endpoints, 5 pending)
- **Automatic test data cleanup**
- **Clear error messages and troubleshooting guidance**
- **Real API and database testing** (no mocks)
- **Easy CI/CD integration**

All tests follow the project's existing testing patterns and can be run with a single command: `npm run test:api`
