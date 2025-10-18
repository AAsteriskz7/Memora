# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Initialize Next.js 14 project with TypeScript
  - Install dependencies: Prisma, @google/generative-ai, pgvector
  - Configure TypeScript with strict mode
  - Set up project folder structure (api routes, services, types, utils)
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Configure Supabase database and Prisma

  - Create Supabase project and get connection string
  - Add DATABASE_URL to environment variables
  - Create Prisma schema with Entry model including vector field
  - Generate Prisma client
  - Run Prisma migration to create tables (pgvector already enabled)
  - _Requirements: 1.2, 1.5, 2.1_

- [x] 3. Implement LLM service with Gemini integration

  - Create LLMService class with Gemini 2.5 Flash client
  - Implement generateEmbedding method using text-embedding-004
  - Implement generateResponse method for chat completions
  - Implement extractTimePeriod method for temporal query parsing
  - Add error handling and retry logic for API failures
  - _Requirements: 4.2, 4.3, 4.5_

- [x] 4. Implement embedding service for semantic search

  - Create EmbeddingService class
  - Implement generateEmbedding wrapper method
  - Implement findSimilarEntries using pgvector cosine similarity
  - Add time period filtering to vector search queries
  - Calculate and return relevance scores
  - _Requirements: 4.3, 4.4_

- [x] 5. Implement entry service for CRUD operations

  - Create EntryService class
  - Implement createEntry with automatic embedding generation
  - Implement getEntries with pagination and date filtering
  - Implement getEntryById for single entry retrieval
  - Implement updateEntry with embedding regeneration
  - Implement deleteEntry with proper cleanup
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.5_

- [x] 6. Implement past-self service

  - Create PastSelfService class
  - Implement query method orchestrating the full flow
  - Implement extractTimePeriod using LLM service
  - Implement findRelevantEntries using embedding service
  - Implement generateResponse with proper prompt construction

  - Add logic to handle limited entry scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Create API endpoint for creating entries

  - Implement POST /api/entries route handler
  - Add request validation for content and optional createdAt
  - Call EntryService.createEntry
  - Return 201 response with created entry
  - Add error handling for validation and database errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. Create API endpoint for retrieving entries

  - Implement GET /api/entries route handler
  - Parse and validate query parameters (page, limit, startDate, endDate)
  - Call EntryService.getEntries with pagination options
  - Return paginated response with entries and metadata
  - Add error handling for invalid parameters
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

-

- [x] 9. Create API endpoint for single entry retrieval

  - Implement GET /api/entries/[id] route handler
  - Validate entry ID parameter
  - Call EntryService.getEntryById

  - Return 200 with entry or 404 if not found
  - Add error handling
  - _Requirements: 2.2, 5.5_

- [x] 10. Create API endpoint for updating entries

  - Implement PUT /api/entries/[id] route handler
  - Validate entry ID and content in request
  - Call EntryService.updateEntry
  - Return 200 with updated entry
  - Add error handling for not found and validation errors
  - _Requirements: 3.1, 3.2_

- [x] 11. Create API endpoint for deleting entries

  - Implement DELETE /api/entri
    es/[id] route handler
  - Validate entry ID parameter
  - Call EntryService.deleteEntry
  - Return 204 no content on success
  - Add error handling for not found errors
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 12. Implement time period presets utility

  - Create TimePeriodPresets utility class with preset configurations
  - Implement preset calculation logic (1 year ago, 5 years ago, college years, etc.)
  - Add preset validation and error handling

  - Create helper methods to convert presets to date ranges
  - Support both relative presets (1-year-ago) and contextual presets (college-years)
  - _Requirements: 4.2, 4.3_

- [x] 14. Create mock data generation script

  - Create script to generate realistic journal entries
  - Generate entries spanning multiple years (2020-2025)
  - Include varied topics: career, relationships, personal growth, daily life
  - Include varied emotional tones and writing styles
  - Generate at least 700 diverse entries
  - Seed database with generated entries including embeddings
  - _Requirements: All (for testing purposes)_

- [x] 15. Create environment configuration

  - Create .env.example file with all required variables
  - Document each environment variable
  - Add .env to .gitignore
  - Create setup instructions in README
  - _Requirements: All_

- [x] 16. Create API endpoint for past-self queries


  - Implement POST /api/past-self/query route handler
  - Validate query and optional timePeriod/preset in request body
  - Integrate time period presets with PastSelfService
  - Call PastSelfService.query with resolved time periods
  - Return response with answer, references, and metadata
  - Handle edge cases (no entries, no relevant entries)
  - Add comprehensive error handling
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 17. Write API integration tests







  - Test POST /api/entries endpoint
  - Test GET /api/entries with pagination and filtering
  - Test GET /api/entries/[id] endpoint
  - Test PUT /api/entries/[id] endpoint
  - Test DELETE /api/entries/[id] endpoint
  - Test POST /api/past-self/query endpoint with various scenarios
  - Test error cases and edge conditions
  - _Requirements: All_

- [ ] 18. Add API documentation

  - Document all API endpoints with examples

  - Create Postman/Thunder Client collection
  - Add inline code documentation
  - Document error responses
  - _Requirements: All_

- [-] 19. Create simple test frontend for past-self conversations


  - Create a basic React page for testing past-self conversations
  - Add form for entering journal entries with date selection
  - Add chat interface for asking questions to past self
  - Include time period preset selector (college years, 1 year ago, etc.)
  - Display conversation history with past self responses
  - Show entry references and metadata for each response
  - Add basic styling for usability
  - Include error handling and loading states
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_
