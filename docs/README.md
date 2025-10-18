# AI Journal API Documentation

This directory contains comprehensive documentation for the AI Journal API, including detailed endpoint specifications, testing collections, and usage examples.

## 📁 Documentation Files

### Core Documentation
- **[API.md](./API.md)** - Complete API reference with all endpoints, parameters, responses, and examples
- **[README.md](./README.md)** - This file, overview of documentation structure

### Testing Collections
- **[AI-Journal-API.postman_collection.json](./AI-Journal-API.postman_collection.json)** - Postman collection with all endpoints and tests
- **[thunder-client-collection.json](./thunder-client-collection.json)** - Thunder Client collection for VS Code users

## 🚀 Quick Start

### 1. Import API Collection

**For Postman:**
1. Open Postman
2. Click "Import" 
3. Select `AI-Journal-API.postman_collection.json`
4. Set the `baseUrl` variable to `http://localhost:3000/api`

**For Thunder Client (VS Code):**
1. Install Thunder Client extension
2. Open Thunder Client
3. Import `thunder-client-collection.json`
4. Set the `baseUrl` environment variable to `http://localhost:3000/api`

### 2. Test Basic Functionality

1. **Create an entry** using the "Create Entry" request
2. **List entries** using the "Get All Entries" request  
3. **Query past self** using any of the past-self conversation requests

## 📖 API Overview

The AI Journal API provides two main categories of endpoints:

### Journal Entries (`/api/entries`)
- **POST** `/api/entries` - Create new journal entry
- **GET** `/api/entries` - List entries with pagination and filtering
- **GET** `/api/entries/{id}` - Get specific entry by ID
- **PUT** `/api/entries/{id}` - Update existing entry
- **DELETE** `/api/entries/{id}` - Delete entry permanently

### Past-Self Conversations (`/api/past-self`)
- **POST** `/api/past-self/query` - Ask questions to your past self

## 🔧 Environment Setup

Ensure your `.env` file contains:

```env
DATABASE_URL=postgresql://...
GOOGLE_API_KEY=your_api_key_here
```

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## 📝 Usage Examples

### Create and Query Workflow

```javascript
// 1. Create a journal entry
const entry = await fetch('/api/entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Today I started learning about machine learning. It feels overwhelming but exciting.'
  })
});

// 2. Query your past self (after having multiple entries)
const response = await fetch('/api/past-self/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What did I think about learning new technologies?',
    preset: '1-year-ago'
  })
});
```

### Time Period Presets

Available presets for past-self queries:

**Relative Presets:**
- `1-month-ago`, `3-months-ago`, `6-months-ago`
- `1-year-ago`, `2-years-ago`, `3-years-ago`, `5-years-ago`, `10-years-ago`

**Contextual Presets:**
- `college-years` - Typical college age (18-22)
- `high-school-years` - Typical high school age (14-18)
- `early-career` - First 5 years of professional career
- `last-decade` - Last 10 years

## 🧪 Testing

### Automated Tests

The collections include comprehensive test cases:

- **Validation Tests** - Verify request/response structure
- **Error Handling Tests** - Test invalid inputs and edge cases
- **Functional Tests** - Test complete workflows
- **Integration Tests** - Test cross-endpoint functionality

### Manual Testing

1. **Happy Path Testing**
   - Create → List → Update → Delete entry workflow
   - Create entries → Query past self workflow

2. **Error Case Testing**
   - Invalid content (empty, too long)
   - Invalid IDs (non-existent, malformed)
   - Invalid dates (future dates, malformed)
   - Invalid presets

3. **Edge Case Testing**
   - Query with no entries
   - Query with limited entries
   - Large content entries
   - Date range filtering

## 🔍 Response Formats

### Success Responses

All successful responses return JSON with appropriate HTTP status codes:
- `200` - Successful retrieval
- `201` - Successful creation
- `204` - Successful deletion (no content)

### Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `DATABASE_ERROR` - Database connection issues
- `AI_SERVICE_ERROR` - AI service unavailable
- `RATE_LIMIT_ERROR` - Rate limit exceeded

## 📊 Data Models

### JournalEntry
```typescript
{
  id: string;           // UUID
  content: string;      // 1-10,000 characters
  createdAt: Date;      // ISO 8601 timestamp
  updatedAt: Date;      // ISO 8601 timestamp
}
```

### PastSelfResponse
```typescript
{
  response: string;                    // AI-generated response
  references: EntryReference[];        // Source entries
  metadata: {
    entriesSearched: number;
    timePeriod: { start: Date; end: Date; };
    warning?: string;
  };
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"No journal entries found" error**
   - Create some entries first using POST `/api/entries`

2. **"AI service temporarily unavailable"**
   - Check `GOOGLE_API_KEY` environment variable
   - Wait if rate limited

3. **"Database connection error"**
   - Check `DATABASE_URL` environment variable
   - Ensure database is running

4. **Invalid date format errors**
   - Use ISO 8601 format: `2024-10-17T10:30:00Z`

### Debug Tips

- Check the browser network tab for detailed error responses
- Verify environment variables are loaded correctly
- Test with simple requests first (create entry, list entries)
- Use the provided test collections to verify setup

## 📚 Additional Resources

- **[API.md](./API.md)** - Detailed endpoint documentation
- **Source Code** - Check `src/app/api/` for implementation details
- **Types** - See `src/types/index.ts` for TypeScript interfaces
- **Tests** - See `src/tests/api-integration.test.ts` for test examples

## 🤝 Contributing

When updating the API:

1. Update endpoint documentation in the route files
2. Update this documentation
3. Update test collections
4. Add new test cases for new functionality
5. Update TypeScript interfaces if needed

## 📄 License

This documentation is part of the AI Journal project.