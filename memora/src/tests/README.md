# API Integration Tests

This directory contains integration tests for the AI Journal API endpoints.

## Running Tests

### Prerequisites

1. Make sure the database is set up and running:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

2. Make sure you have test data in the database (optional but recommended):
   ```bash
   npm run seed:test
   ```

3. Start the development server in one terminal:
   ```bash
   npm run dev
   ```

### Run Tests

In another terminal, run the integration tests:

```bash
npm run test:api
```

Or run directly with tsx:

```bash
npx tsx src/tests/api-integration.test.ts
```

## Test Coverage

The integration tests cover the following API endpoints:

### POST /api/entries
- ✅ Create entry with valid content
- ✅ Create entry with custom createdAt
- ✅ Reject empty content
- ✅ Reject content over 10,000 characters
- ✅ Reject missing content field
- ✅ Reject invalid createdAt
- ✅ Reject future createdAt
- ✅ Reject invalid JSON

### GET /api/entries
- ✅ Get entries with default pagination
- ✅ Get entries with custom pagination
- ✅ Get entries with date filtering
- ✅ Reject invalid page parameter
- ✅ Reject invalid limit parameter
- ✅ Reject invalid startDate
- ✅ Reject startDate after endDate

### GET /api/entries/[id]
- ✅ Get entry by valid ID
- ✅ Return 404 for non-existent ID
- ✅ Handle empty ID

### PUT /api/entries/[id]
- ✅ Update entry with valid content
- ✅ Return 404 for non-existent ID
- ✅ Reject empty content
- ✅ Reject content over 10,000 characters
- ✅ Reject missing content field

### DELETE /api/entries/[id]
- ✅ Delete entry with valid ID
- ✅ Verify entry was deleted
- ✅ Return 404 for non-existent ID

### POST /api/past-self/query (Pending Implementation)
- ⏳ Query with specific time period
- ⏳ Query without time period
- ⏳ Reject empty query
- ⏳ Handle no entries scenario
- ⏳ Handle no relevant entries for time period

## Test Output

The tests will output:
- ✅ for passed tests
- ❌ for failed tests
- A summary with total, passed, failed counts and success rate
- Automatic cleanup of test data

## Environment Variables

The tests use the following environment variables:

- `BASE_URL`: The base URL of the API (default: `http://localhost:3000`)
- `DATABASE_URL`: Database connection string (from .env)
- `GOOGLE_API_KEY`: Google API key for embeddings (from .env)

## Notes

- Tests automatically clean up created entries after completion
- Tests require the development server to be running
- Some tests for the past-self endpoint are pending implementation of that endpoint
- Tests use real API calls and database operations (not mocked)
