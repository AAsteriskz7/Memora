# Memora - AI-Backed Diary

Memora is an intelligent journaling application that lets you have conversations with your "past self" using AI-powered semantic search and natural language processing.

## Features

- 📝 **Journal Entries**: Create, read, update, and delete journal entries
- 🔍 **Semantic Search**: Find relevant entries using AI-powered vector search
- 💬 **Past-Self Conversations**: Ask questions and get insights from your historical entries
- ⏰ **Time Period Presets**: Query specific time periods (1 year ago, college years, etc.)
- 🤖 **AI-Powered**: Uses Anthropic Claude for natural language understanding

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with pgvector (Supabase)
- **AI**: Anthropic Claude + Google AI (embeddings)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Claude AI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd memora
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase Database URLs (from Supabase Dashboard > Settings > Database)
DATABASE_URL=postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-us-east-1.compute.amazonaws.com:5432/postgres

# Anthropic Claude API Key (from https://console.anthropic.com/settings/keys)
ANTHROPIC_API_KEY=your_api_key_here

# Google AI API Key for embeddings (from https://aistudio.google.com/app/apikey)
GOOGLE_API_KEY=your_google_api_key_here

# Model Configuration (defaults are fine)
CLAUDE_MODEL=claude-haiku-4-5-20251001
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# Verify database connection
npx tsx scripts/setup-database.ts
```

### 4. Add Mock Data (Optional)

Import example entries:

```bash
npm run import:entries example-entries.json
```

Or generate 700+ template entries:

```bash
npm run seed:mock
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## API Endpoints

### Journal Entries

- `GET /api/entries` - List entries (paginated)
- `POST /api/entries` - Create new entry
- `GET /api/entries/[id]` - Get specific entry
- `PUT /api/entries/[id]` - Update entry
- `DELETE /api/entries/[id]` - Delete entry

### Past-Self Conversations

- `POST /api/past-self/query` - Query your past self

**Example request:**

```json
{
  "query": "What was I thinking about my career last year?",
  "preset": "1-year-ago"
}
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (WARNING: deletes all data)

# Data Management
npm run import:entries   # Import entries from JSON file
npm run seed:mock        # Generate 700+ template entries
npm run seed:test        # Create 3 test entries
npm run seed:validate    # Validate mock data generation

# Utilities
npm run lint             # Run ESLint
```

## Project Structure

```
memora/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── entries/      # Entry CRUD endpoints
│   │   │   └── past-self/    # Past-self query endpoint
│   │   └── page.tsx          # Home page
│   ├── services/             # Business logic
│   │   ├── entry.service.ts
│   │   ├── embedding.service.ts
│   │   ├── llm.service.ts
│   │   └── past-self.service.ts
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/                  # Utility scripts
└── public/                   # Static assets
```

## Documentation

- **[Frontend Setup Guide](FRONTEND_SETUP.md)** - For frontend developers
- **[Writer Instructions](WRITER_INSTRUCTIONS.md)** - For creating journal entries
- **[Entry Data Format](ENTRY_DATA_FORMAT.md)** - Data format specifications
- **[Mock Data Guide](MOCK_DATA_GUIDE.md)** - Using mock data generation

## Environment Variables Reference

| Variable                 | Description                       | Required | Default                     |
| ------------------------ | --------------------------------- | -------- | --------------------------- |
| `DATABASE_URL`           | Supabase pooled connection string | Yes      | -                           |
| `DIRECT_URL`             | Supabase direct connection string | Yes      | -                           |
| `ANTHROPIC_API_KEY`      | Anthropic Claude API key          | Yes      | -                           |
| `GOOGLE_API_KEY`         | Google AI API key for embeddings  | Yes      | -                           |
| `CLAUDE_MODEL`           | Chat completion model             | No       | `claude-haiku-4-5-20251001` |
| `GEMINI_EMBEDDING_MODEL` | Text embedding model              | No       | `gemini-embedding-001`      |
| `NODE_ENV`               | Environment mode                  | No       | `development`               |
| `PORT`                   | Server port                       | No       | `3000`                      |

## Time Period Presets

Available presets for querying past entries:

- **Relative**: `1-month-ago`, `3-months-ago`, `6-months-ago`, `1-year-ago`, `2-years-ago`, `3-years-ago`, `5-years-ago`, `10-years-ago`
- **Contextual**: `college-years`, `high-school-years`, `early-career`, `last-decade`

## Troubleshooting

### Database Connection Issues

```bash
# Check connection
npx tsx scripts/setup-database.ts

# Regenerate Prisma client
npm run db:generate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### API Errors

- Verify environment variables are set correctly
- Check that the dev server is running
- Ensure database migrations have been run
- Check browser console for detailed error messages

### No Data Showing

- Import test data: `npm run import:entries example-entries.json`
- Or create entries via the API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
