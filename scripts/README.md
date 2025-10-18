# Mock Data Generation Scripts

This directory contains scripts for generating test data for the AI Journal application.

## generate-mock-data.ts

Generates realistic journal entries for testing the AI Journal system.

### Features

- **700+ diverse entries** spanning 2020-2025
- **Varied topics**: career, relationships, personal growth, daily life, travel, health
- **Emotional variety**: positive, negative, and neutral tones
- **Writing styles**: casual, reflective, and emotional
- **Automatic embedding generation** using Gemini text-embedding-004
- **Database seeding** with proper timestamps

### Usage

```bash
# Run the mock data generation script
npm run seed:mock

# Or run directly with tsx
npx tsx scripts/generate-mock-data.ts
```

### Requirements

- Environment variables must be set (GOOGLE_API_KEY, DATABASE_URL)
- Database must be migrated and ready
- Sufficient API quota for embedding generation

### Output

The script will:
1. Generate 700+ realistic journal entries with varied content
2. Create embeddings for each entry using the LLM service
3. Seed the database with entries and embeddings
4. Provide progress updates and final statistics

### Entry Variety

**Topics covered:**
- Career milestones, challenges, and reflections
- Relationship dynamics, dates, breakups, family time
- Personal growth, therapy sessions, self-discovery
- Daily life moments, weather, food, simple pleasures
- Travel experiences, adventures, cultural observations
- Health and fitness journeys, mental health check-ins

**Emotional tones:**
- Positive: celebrations, achievements, joy, gratitude
- Negative: struggles, disappointments, anxiety, sadness
- Neutral: observations, routine activities, mild reflections

**Writing styles:**
- Casual: informal language, contractions, everyday expressions
- Reflective: thoughtful analysis, deeper insights, philosophical
- Emotional: expressive language, strong feelings, vulnerability

### Performance

- Processes entries in batches of 50 to manage API rate limits
- Includes 2-second delays between batches
- Provides detailed progress reporting
- Error handling for individual entry failures
- Typical runtime: 15-30 minutes depending on API response times