# Frontend Developer Setup Guide

Welcome! This guide will help you get started with the Memora AI Journal frontend development.

## Project Overview

Memora is an AI-powered journal application that lets users have conversations with their "past self" by querying their historical journal entries using semantic search and AI.

**Tech Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- PostgreSQL (Supabase)
- Anthropic Claude AI (chat) + Google AI (embeddings)

## Important: Next.js App Router

This project uses **Next.js 15 with the App Router** (not the old Pages Router). Here's what you need to know:

### File-Based Routing
- Create pages by adding `page.tsx` files in `src/app/`
- Example: `src/app/entries/page.tsx` → `/entries` URL
- Dynamic routes: `src/app/entries/[id]/page.tsx` → `/entries/123`

### Server vs Client Components
- **By default, all components are Server Components** (run on server)
- Add `'use client'` at the top of files that need:
  - React hooks (`useState`, `useEffect`, etc.)
  - Event handlers (`onClick`, `onChange`, etc.)
  - Browser APIs (localStorage, window, etc.)

```tsx
'use client';  // ← Add this line for interactive components

import { useState } from 'react';

export default function MyPage() {
  const [data, setData] = useState([]);
  // Now you can use hooks and event handlers
}
```

### API Routes are Ready
- All backend APIs are in `src/app/api/` - **don't modify these**
- Just call them from your frontend: `fetch('/api/entries')`
- No need to build any backend code

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

### 3. Verify Setup
```bash
# Test database connection
npx tsx scripts/setup-database.ts
```

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Environment Variables

The `.env` file is already configured with:
- `DATABASE_URL` - Supabase connection (pooled)
- `DIRECT_URL` - Supabase direct connection
- `ANTHROPIC_API_KEY` - Claude AI API key
- `CLAUDE_MODEL` - Chat model (claude-haiku-4-5-20251001)
- `GOOGLE_API_KEY` - Google AI API key for embeddings
- `GEMINI_EMBEDDING_MODEL` - Embedding model (gemini-embedding-001)

**You don't need to change anything** - it's ready to use!

## Available API Endpoints

All backend APIs are already implemented and working:

### Journal Entries API

**GET /api/entries**
- Get paginated list of journal entries
- Query params: `page`, `limit`, `startDate`, `endDate`
- Returns: entries with pagination metadata

**POST /api/entries**
- Create a new journal entry
- Body: `{ content: string, createdAt?: string }`
- Automatically generates embeddings

**GET /api/entries/[id]**
- Get a specific entry by ID

**PUT /api/entries/[id]**
- Update an entry
- Body: `{ content: string }`
- Regenerates embeddings

**DELETE /api/entries/[id]**
- Delete an entry

### Past-Self Conversation API

**POST /api/past-self/query**
- Query your past self with natural language
- Body: `{ query: string, timePeriod?: { start: string, end: string }, preset?: string }`
- Returns: AI response with relevant entry references

**Example request:**
```json
{
  "query": "What was I thinking about my career last year?",
  "preset": "1-year-ago"
}
```

**Example response:**
```json
{
  "response": "Based on your entries from last year, you were...",
  "references": [
    {
      "entryId": "uuid",
      "date": "2023-06-15T00:00:00Z",
      "excerpt": "Had an amazing breakthrough at work...",
      "relevanceScore": 0.89
    }
  ],
  "metadata": {
    "entriesSearched": 45,
    "timePeriod": {
      "start": "2023-01-01T00:00:00Z",
      "end": "2023-12-31T23:59:59Z"
    }
  }
}
```

## Time Period Presets

Available presets for past-self queries:
- `1-month-ago`, `3-months-ago`, `6-months-ago`
- `1-year-ago`, `2-years-ago`, `3-years-ago`, `5-years-ago`, `10-years-ago`
- `college-years`, `high-school-years`, `early-career`, `last-decade`

## Testing the APIs

### Using curl

**Get entries:**
```bash
curl http://localhost:3000/api/entries?limit=5
```

**Create entry:**
```bash
curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{"content": "Today was a great day! I learned so much about React."}'
```

**Query past self:**
```bash
curl -X POST http://localhost:3000/api/past-self/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What was I thinking about last month?", "preset": "1-month-ago"}'
```

### Using the browser

Once the dev server is running, you can test APIs using browser dev tools or tools like Postman.

## Mock Data

To test with realistic data, you have two options:

### Option 1: Import Custom Entries
If you have a JSON file with entries:
```bash
npm run import:entries your-entries.json
```

### Option 2: Generate Template Data
Generate 700+ template entries (takes 15-30 minutes):
```bash
npm run seed:mock
```

## What You Need to Build

### Core Pages/Components

1. **Home/Landing Page** (`/`)
   - Introduction to the app
   - Call-to-action to start journaling or query past self

2. **Journal Entry List** (`/entries`)
   - Display paginated list of entries
   - Filter by date range
   - Search functionality
   - Create new entry button

3. **Entry Detail/Edit** (`/entries/[id]`)
   - View full entry
   - Edit entry content
   - Delete entry
   - Show creation/update timestamps

4. **New Entry Form** (`/entries/new`)
   - Rich text editor for journal content
   - Optional date picker (defaults to today)
   - Save/cancel actions

5. **Past-Self Chat Interface** (`/past-self`)
   - Chat-like UI for querying past self
   - Time period selector (presets + custom range)
   - Display AI responses with entry references
   - Click references to view full entries
   - Conversation history

6. **Settings/Profile** (`/settings`)
   - User preferences
   - Export data
   - Account management

### UI/UX Considerations

**Design Philosophy:**
- Clean, minimal, journal-like aesthetic
- Focus on readability and writing experience
- Warm, personal color palette
- Smooth transitions and animations

**Key Features:**
- Responsive design (mobile-first)
- Dark mode support
- Keyboard shortcuts for power users
- Loading states for AI queries
- Error handling with helpful messages

## Project Structure

```
memora/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes (already done - don't touch)
│   │   ├── entries/           # Entry pages (you build)
│   │   ├── past-self/         # Chat interface (you build)
│   │   └── page.tsx           # Home page (you build)
│   ├── components/            # React components (you build - created for you)
│   ├── lib/                   # Client utilities (you build - created for you)
│   ├── hooks/                 # Custom React hooks (you build - created for you)
│   ├── services/              # Backend services (already done - don't touch)
│   ├── types/                 # TypeScript types (already done - use these)
│   └── utils/                 # Backend utilities (already done - don't touch)
├── prisma/                    # Database schema (already done - don't touch)
└── public/                    # Static assets (you add)
```

**📖 See [FRONTEND_STRUCTURE.md](FRONTEND_STRUCTURE.md) for detailed guide on where to add your code!**

## Development Tips

### Working with the API

All API routes are in `src/app/api/`. You can:
- Read the route files to understand request/response formats
- Check `src/types/index.ts` for TypeScript types
- Use the types in your frontend code for type safety

### Example: Fetching Entries

```typescript
import { PaginatedResponse, JournalEntry } from '@/types';

async function getEntries(page: number = 1) {
  const response = await fetch(`/api/entries?page=${page}&limit=20`);
  const data: PaginatedResponse<JournalEntry> = await response.json();
  return data;
}
```

### Example: Querying Past Self

```typescript
import { PastSelfResponse } from '@/types';

async function queryPastSelf(query: string, preset?: string) {
  const response = await fetch('/api/past-self/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, preset })
  });
  const data: PastSelfResponse = await response.json();
  return data;
}
```

## Styling Options

The project doesn't have a styling framework set up yet. You can choose:

1. **Tailwind CSS** (recommended for rapid development)
2. **CSS Modules** (already supported by Next.js)
3. **Styled Components** or other CSS-in-JS
4. **Plain CSS/SCSS**

Just install your preferred option and start styling!

## Testing Your Work

1. **Manual Testing**: Use the dev server and test in browser
2. **API Testing**: Use curl or Postman to verify API integration
3. **Mock Data**: Import test entries to see realistic data

## Common Issues & Solutions

### Database Connection Error
```bash
# Regenerate Prisma client
npm run db:generate

# Check connection
npx tsx scripts/setup-database.ts
```

### API Not Working
- Check if dev server is running (`npm run dev`)
- Verify environment variables are set
- Check browser console for errors

### No Data Showing
- Import some test entries: `npm run import:entries example-entries.json`
- Or create entries via the API

## Getting Help

- **Backend code**: Check `src/services/` and `src/app/api/`
- **Types**: See `src/types/index.ts`
- **Database schema**: See `prisma/schema.prisma`
- **API examples**: See this document or test with curl

## Next Steps

1. ✅ Set up your development environment
2. ✅ Verify APIs are working
3. 🎨 Choose your styling approach
4. 🏗️ Build the home page
5. 📝 Create the entry list and forms
6. 💬 Build the past-self chat interface
7. ✨ Add polish and animations

The backend is solid and ready - now make it beautiful! 🚀