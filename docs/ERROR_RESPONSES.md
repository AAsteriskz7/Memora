# API Error Responses Reference

This document provides a comprehensive reference for all error responses in the AI Journal API, including status codes, error messages, and troubleshooting guidance.

## Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

- `error` (string): Human-readable description of the error
- `code` (string, optional): Machine-readable error code for programmatic handling
- `details` (object, optional): Additional context or structured data about the error

## HTTP Status Codes

### 400 Bad Request
Client-side errors due to invalid request data or parameters.

### 404 Not Found
Requested resource does not exist.

### 429 Too Many Requests
Rate limiting has been triggered.

### 503 Service Unavailable
External services (database, AI) are temporarily unavailable.

### 500 Internal Server Error
Unexpected server-side errors.

## Journal Entries Errors

### POST /api/entries

#### 400 - Invalid JSON
```json
{
  "error": "Invalid JSON in request body"
}
```
**Cause:** Malformed JSON in request body  
**Solution:** Ensure valid JSON syntax

#### 400 - Missing Content
```json
{
  "error": "Content is required"
}
```
**Cause:** Missing `content` field in request  
**Solution:** Include `content` field with string value

#### 400 - Invalid Content Type
```json
{
  "error": "Content must be a string"
}
```
**Cause:** `content` field is not a string  
**Solution:** Ensure `content` is a string value

#### 400 - Empty Content
```json
{
  "error": "Content cannot be empty"
}
```
**Cause:** `content` field is empty or only whitespace  
**Solution:** Provide meaningful content (at least 1 character after trimming)

#### 400 - Content Too Long
```json
{
  "error": "Content cannot exceed 10,000 characters"
}
```
**Cause:** `content` field exceeds 10,000 character limit  
**Solution:** Reduce content length to 10,000 characters or less

#### 400 - Invalid Date Format
```json
{
  "error": "createdAt must be a valid ISO 8601 date string"
}
```
**Cause:** `createdAt` field is not a valid ISO 8601 date  
**Solution:** Use format like `2024-10-17T10:30:00Z`

#### 400 - Future Date
```json
{
  "error": "createdAt cannot be in the future"
}
```
**Cause:** `createdAt` date is in the future  
**Solution:** Use current time or past date

#### 503 - Database Error
```json
{
  "error": "Database connection error. Please try again later."
}
```
**Cause:** Database connection issues  
**Solution:** Check `DATABASE_URL`, ensure database is running, retry request

#### 503 - AI Service Error
```json
{
  "error": "AI service temporarily unavailable. Please try again later."
}
```
**Cause:** Embedding generation failed  
**Solution:** Check `GOOGLE_API_KEY`, wait and retry

### GET /api/entries

#### 400 - Invalid Page Parameter
```json
{
  "error": "Page must be a positive integer"
}
```
**Cause:** `page` parameter is not a positive integer  
**Solution:** Use positive integer values (1, 2, 3, ...)

#### 400 - Invalid Limit Parameter
```json
{
  "error": "Limit must be between 1 and 100"
}
```
**Cause:** `limit` parameter is outside valid range  
**Solution:** Use values between 1 and 100

#### 400 - Invalid Start Date
```json
{
  "error": "startDate must be a valid ISO 8601 date string"
}
```
**Cause:** `startDate` parameter is not valid ISO 8601 format  
**Solution:** Use format like `2024-01-01T00:00:00Z`

#### 400 - Invalid End Date
```json
{
  "error": "endDate must be a valid ISO 8601 date string"
}
```
**Cause:** `endDate` parameter is not valid ISO 8601 format  
**Solution:** Use format like `2024-12-31T23:59:59Z`

#### 400 - Invalid Date Range
```json
{
  "error": "startDate must be before endDate"
}
```
**Cause:** `startDate` is after `endDate`  
**Solution:** Ensure `startDate` is chronologically before `endDate`

### GET /api/entries/[id]

#### 400 - Missing Entry ID
```json
{
  "error": "Entry ID is required"
}
```
**Cause:** Entry ID path parameter is missing  
**Solution:** Include valid UUID in URL path

#### 400 - Invalid Entry ID Type
```json
{
  "error": "Entry ID must be a string"
}
```
**Cause:** Entry ID is not a string  
**Solution:** Provide string UUID value

#### 400 - Empty Entry ID
```json
{
  "error": "Entry ID cannot be empty"
}
```
**Cause:** Entry ID is empty string  
**Solution:** Provide valid UUID

#### 404 - Entry Not Found
```json
{
  "error": "Entry not found"
}
```
**Cause:** Entry with specified ID does not exist  
**Solution:** Verify entry ID exists, check with GET /api/entries

### PUT /api/entries/[id]

#### 400 - Invalid JSON
```json
{
  "error": "Invalid JSON in request body"
}
```
**Cause:** Malformed JSON in request body  
**Solution:** Ensure valid JSON syntax

#### 400 - Missing Content
```json
{
  "error": "Content is required"
}
```
**Cause:** Missing `content` field in request body  
**Solution:** Include `content` field with string value

#### 400 - Invalid Content Type
```json
{
  "error": "Content must be a string"
}
```
**Cause:** `content` field is not a string  
**Solution:** Ensure `content` is a string value

#### 400 - Empty Content
```json
{
  "error": "Content cannot be empty"
}
```
**Cause:** `content` field is empty or only whitespace  
**Solution:** Provide meaningful content

#### 400 - Content Too Long
```json
{
  "error": "Content cannot exceed 10,000 characters"
}
```
**Cause:** `content` field exceeds character limit  
**Solution:** Reduce content length

#### 404 - Entry Not Found
```json
{
  "error": "Entry not found"
}
```
**Cause:** Entry with specified ID does not exist  
**Solution:** Verify entry ID exists

### DELETE /api/entries/[id]

#### 400 - Missing Entry ID
```json
{
  "error": "Entry ID is required"
}
```
**Cause:** Entry ID path parameter is missing  
**Solution:** Include valid UUID in URL path

#### 404 - Entry Not Found
```json
{
  "error": "Entry not found"
}
```
**Cause:** Entry with specified ID does not exist  
**Solution:** Verify entry ID exists

## Past-Self Query Errors

### POST /api/past-self/query

#### 400 - Invalid JSON
```json
{
  "error": "Invalid JSON in request body"
}
```
**Cause:** Malformed JSON in request body  
**Solution:** Ensure valid JSON syntax

#### 400 - Missing Query
```json
{
  "error": "Query is required"
}
```
**Cause:** Missing `query` field in request body  
**Solution:** Include `query` field with string value

#### 400 - Invalid Query Type
```json
{
  "error": "Query must be a string"
}
```
**Cause:** `query` field is not a string  
**Solution:** Ensure `query` is a string value

#### 400 - Empty Query
```json
{
  "error": "Query cannot be empty"
}
```
**Cause:** `query` field is empty or only whitespace  
**Solution:** Provide meaningful query text

#### 400 - Query Too Long
```json
{
  "error": "Query cannot exceed 1,000 characters"
}
```
**Cause:** `query` field exceeds character limit  
**Solution:** Reduce query length to 1,000 characters or less

#### 400 - Invalid Time Period Start
```json
{
  "error": "timePeriod.start must be a valid ISO 8601 date string"
}
```
**Cause:** `timePeriod.start` is not valid ISO 8601 format  
**Solution:** Use format like `2024-01-01T00:00:00Z`

#### 400 - Invalid Time Period End
```json
{
  "error": "timePeriod.end must be a valid ISO 8601 date string"
}
```
**Cause:** `timePeriod.end` is not valid ISO 8601 format  
**Solution:** Use format like `2024-12-31T23:59:59Z`

#### 400 - Invalid Time Period Range
```json
{
  "error": "timePeriod.start must be before timePeriod.end"
}
```
**Cause:** Start date is after end date  
**Solution:** Ensure start date is chronologically before end date

#### 400 - Invalid Preset
```json
{
  "error": "Invalid preset. Valid presets are: 1-month-ago, 3-months-ago, 6-months-ago, 1-year-ago, 2-years-ago, 3-years-ago, 5-years-ago, 10-years-ago, college-years, high-school-years, early-career, last-decade",
  "code": "INVALID_PRESET",
  "details": {
    "validPresets": [
      "1-month-ago", "3-months-ago", "6-months-ago", "1-year-ago",
      "2-years-ago", "3-years-ago", "5-years-ago", "10-years-ago",
      "college-years", "high-school-years", "early-career", "last-decade"
    ]
  }
}
```
**Cause:** Invalid preset value  
**Solution:** Use one of the valid presets listed in `details.validPresets`

#### 400 - Conflicting Parameters
```json
{
  "error": "Cannot specify both timePeriod and preset. Choose one."
}
```
**Cause:** Both `timePeriod` and `preset` provided in request  
**Solution:** Use either `timePeriod` OR `preset`, not both

#### 400 - No Entries Found
```json
{
  "error": "No journal entries found. Please write your first entry to start conversations with your past self.",
  "code": "NO_ENTRIES"
}
```
**Cause:** User has no journal entries in database  
**Solution:** Create journal entries using POST /api/entries first

#### 400 - Preset Resolution Error
```json
{
  "error": "Failed to resolve preset: college-years",
  "code": "PRESET_RESOLUTION_ERROR"
}
```
**Cause:** Error calculating date range for preset  
**Solution:** Try different preset or use custom `timePeriod`

#### 429 - Rate Limit Exceeded
```json
{
  "error": "AI service rate limit exceeded. Please try again in a few minutes.",
  "code": "RATE_LIMIT_ERROR"
}
```
**Cause:** Too many requests to AI service  
**Solution:** Wait a few minutes before retrying

#### 503 - Database Error
```json
{
  "error": "Database connection error. Please try again later.",
  "code": "DATABASE_ERROR"
}
```
**Cause:** Database connection issues  
**Solution:** Check database connectivity, retry request

#### 503 - AI Service Error
```json
{
  "error": "AI service temporarily unavailable. Please try again later.",
  "code": "AI_SERVICE_ERROR"
}
```
**Cause:** AI service (embedding or LLM) unavailable  
**Solution:** Check `GOOGLE_API_KEY`, wait and retry

## Error Handling Best Practices

### Client-Side Error Handling

```javascript
async function handleApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error codes
      switch (error.code) {
        case 'NO_ENTRIES':
          // Redirect to entry creation
          break;
        case 'INVALID_PRESET':
          // Show valid presets to user
          console.log('Valid presets:', error.details.validPresets);
          break;
        case 'RATE_LIMIT_ERROR':
          // Show retry message with timer
          break;
        case 'DATABASE_ERROR':
        case 'AI_SERVICE_ERROR':
          // Show service unavailable message
          break;
        default:
          // Show generic error message
          console.error('API Error:', error.error);
      }
      
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError') {
      // Network error
      console.error('Network error:', err.message);
    } else {
      // API error
      console.error('API error:', err.message);
    }
    throw err;
  }
}
```

### Retry Logic

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await handleApiRequest(url, options);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Only retry on service errors
      if (error.message.includes('service') || error.message.includes('database')) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Don't retry validation errors
      throw error;
    }
  }
}
```

## Troubleshooting Guide

### Environment Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` in `.env` file
   - Check database server is running
   - Verify network connectivity to database

2. **AI Service Errors**
   - Verify `GOOGLE_API_KEY` in `.env` file
   - Check API key has necessary permissions
   - Verify API quota hasn't been exceeded

### Common Validation Errors

1. **Date Format Issues**
   - Always use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
   - Include timezone information
   - Use UTC timezone for consistency

2. **Content Length Issues**
   - Check character count before sending
   - Consider content trimming for user input
   - Implement client-side validation

3. **ID Format Issues**
   - Ensure UUIDs are properly formatted
   - Validate UUIDs exist before operations
   - Handle UUID generation consistently

### Performance Considerations

1. **Rate Limiting**
   - Implement client-side rate limiting
   - Use exponential backoff for retries
   - Cache responses when appropriate

2. **Large Responses**
   - Use pagination for entry lists
   - Implement response streaming for large datasets
   - Consider response compression

## Testing Error Scenarios

Use the provided test collections to verify error handling:

1. **Validation Errors** - Test with invalid inputs
2. **Not Found Errors** - Test with non-existent IDs
3. **Service Errors** - Test with invalid API keys
4. **Rate Limiting** - Test with rapid successive requests

This ensures your application handles all error scenarios gracefully.