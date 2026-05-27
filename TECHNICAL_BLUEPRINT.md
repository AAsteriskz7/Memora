# MEMORA: TECHNICAL BLUEPRINT & INTERVIEW PREP DOCUMENT

## SECTION 1: RESUME & INTERVIEW QUICK-HITTERS
* **1-Sentence Pitch:** An AI-powered journaling application built in 24 hours that leverages Retrieval-Augmented Generation (RAG) and temporal database filtering to allow users to semantically query and converse with historical versions of themselves.
* **Tech Stack Snapshot:**
  * **Frontend:** Next.js 15, React 19, Tailwind CSS.
  * **Backend:** Next.js API Routes, Node.js, Prisma ORM.
  * **Database:** PostgreSQL (Supabase), `pgvector` extension.
  * **AI/Services:** Anthropic Claude (Haiku), Google Generative AI (Gemini Embeddings).
  * **Deployment/DevOps:** Local MVP (Hackathon scope), `tsx` for scripting/testing.
* **ATS-Optimized Bullets:**
  * Co-founded and architected the backend of an AI journaling application during a 24-hour hackathon, engineering a Retrieval-Augmented Generation (RAG) pipeline to facilitate conversations with users' past personas.
  * Implemented a hybrid semantic search engine using PostgreSQL `pgvector` and Gemini embeddings, executing raw SQL cosine distance queries (`<=>`) bounded by strict temporal constraints.
  * Engineered a stateless LLM orchestration layer via Anthropic Claude, utilizing advanced prompt engineering and contextual data boundaries to prevent temporal hallucinations and "future knowledge" leakage.
* **Core Role Keywords:** Next.js, React 19, Prisma ORM, PostgreSQL, pgvector, Vector Database, RAG Pipeline, Semantic Search, Anthropic Claude, Prompt Engineering, LLM Orchestration, Hackathon Prototyping.
* **The Whiteboard Translation Blueprint:**
  * **Client Layer:** Next.js App Router UI (`/app/entries`, `/app/past-self`).
  * **API Gateway / Backend:** Next.js Route Handlers (`/api/entries`, `/api/past-self/query`).
  * **AI Orchestration Tier:** Service classes (`llm.service.ts`, `past-self.service.ts`) orchestrating external API calls.
  * **Data Tier:** Prisma ORM connected to Supabase PostgreSQL, mapping unstructured text to vector embeddings.

---

## SECTION 2: SYSTEM ARCHITECTURE, TELEMETRY & DATA FLOW
* **Architectural Pattern:** Monolithic API-First Architecture. The frontend and backend are tightly coupled within the Next.js App Router, while business logic is abstracted into heavily isolated Singleton service classes (`PastSelfService`, `EmbeddingService`, `EntryService`).
* **End-to-End Data Lifecycle (Querying Past Self):**
  1. **Client Request:** User submits a prompt (e.g., "How did I feel last year?").
  2. **Temporal Extraction:** `LLMService` calls Claude to parse the exact temporal intent into a structured JSON `TimePeriod` object.
  3. **Vectorization:** The raw text query is passed to Google Generative AI to generate a dense vector array.
  4. **Semantic Retrieval:** `EmbeddingService` executes a raw SQL `pgvector` cosine similarity (`<=>`) query. It strictly bounds the search to entries `< timePeriod.end`.
  5. **Prompt Injection:** `PastSelfService` aggregates the top 5 vector results (prioritizing the targeted time window and appending 1 older memory for context) and constructs a system prompt.
  6. **LLM Generation:** Anthropic Claude generates a response strictly constrained to the persona's knowledge at `timePeriod.end`.
* **Infrastructure & Environment:** Serverless target (Vercel) supported by Supabase connection pooling (`pgbouncer=true`).
* **Observability, Telemetry & Logging:** Standard output logging. Custom metadata objects are returned to the client containing telemetry on RAG efficiency (e.g., `entriesSearched`, time boundaries, and context warnings).
* **Cost & Resource Topology:** Highly asymmetric load. Storage is cheap (PostgreSQL); compute cost is governed heavily by Anthropic token ingestion (context window size) and Gemini embedding API rates. Implemented exponential backoff with `maxRetries=3` to mitigate API throttling.

---

## SECTION 3: CONFIGURATION, BUILD SYSTEM & SECURITY
* **Build & Dependency Configuration:** 
  * `package.json`: Next.js 15, React 19, `@prisma/client`, `@anthropic-ai/sdk`, `@google/generative-ai`.
  * Heavy reliance on `tsx` for local execution of custom testing scripts in `src/tests`.
* **Environment Variable Contract (`.env.example`):**
  * `DATABASE_URL`: Connection string for Serverless edge functions (Pooler).
  * `DIRECT_URL`: Connection string for Prisma Migrations (Session).
  * `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`: Core AI integrations.
  * `CLAUDE_MODEL`, `GEMINI_EMBEDDING_MODEL`: Defines precise model versions (e.g., `claude-haiku-4-5-20251001`).
* **Authentication, Authorization & Security:**
  * **Current State:** Omitted. Built for a rapid 24-hour hackathon environment; intentionally bypassed user authentication to focus on the core RAG AI challenge.
  * **Security Mitigations:** Centralized request validation layer checking maximum content limits (10,000 characters for entries, 1,000 for queries) to prevent LLM prompt-injection DOS attacks and context-window bloat.

---

## SECTION 4: DATABASE SCHEMAS, MIGRATIONS & DATA SEEDING
* **Relational/NoSQL Database Blueprint:**
  * **Table: `entries`**
    * `id`: String (UUID), Primary Key.
    * `content`: Text (Unbounded unstructured string).
    * `embedding`: `Unsupported("vector(3072)")`. Note: Mismatch between standard Gemini 768-dim models and 3072 schema dimensions, highlighting a migration/scaling design decision.
    * `createdAt`, `updatedAt`: DateTime. Indexed on `createdAt` for fast temporal range filtering.
* **Schema Evolution & Migrations:** Prisma CLI (`prisma migrate dev`). Direct SQL operations are required to activate the `pgvector` extension before Prisma can synchronize.
* **Vector Store / Embeddings Layer:** 
  * Database: PostgreSQL via Supabase.
  * Extension: `pgvector`. 
  * Distance Metric: Cosine Distance (`<=>`), dynamically converted to a 0.0 - 1.0 relevance score (`1 - (distance / 2)`).
* **Seed Data Blueprint:** Controlled via `scripts/import-entries.ts` and `generate-mock-data.ts` to hydrate the database rapidly for AI testing.

---

## SECTION 5: AI / MACHINE LEARNING LAYER
* **Model Pipeline Architecture:** 
  * **Embeddings:** Google Generative AI (`gemini-embedding-001`).
  * **LLM / Chat:** Anthropic Claude Haiku.
* **Agentic / Chain-of-Thought Workflows:**
  * Dual-pass inference pipeline. Pass 1: Extraction (Parsing dates from natural language). Pass 2: Generation (Simulating the persona).
* **Guardrails, Safety & Evaluation:** 
  * Explicit Temporal Guardrails: The prompt specifically enforces `"You have NO knowledge of events after [DATE]"`.
  * Fallback mechanisms: If LLM fails to extract a valid JSON date range, the pipeline falls back to executing an unbounded semantic search.
* **Optimization Strategies:** 
  * RAG limiting: The DB query is restricted to `LIMIT 8`, further filtered to exactly `4` entries inside the target period and `1` entry from the past to provide maximum context without exceeding the context window limits.

---

## SECTION 6: FILE SYSTEM & DEPENDENCY INTERNALS
* **Annotated Directory Tree:**
  ```text
  memora/src/
  ├── app/api/               # Next.js Route Handlers
  │   ├── entries/route.ts   # CRUD operations for journal data
  │   └── past-self/query/   # Multi-stage AI chat pipeline
  ├── services/              # Isolated Business Logic Layer
  │   ├── embedding.service.ts # pgvector distance operations
  │   ├── entry.service.ts     # Database abstraction
  │   ├── llm.service.ts       # Network boundaries to Anthropic/Google
  │   └── past-self.service.ts # Core orchestration/RAG logic
  ├── tests/                 # tsx execution files for local integration validation
  ```
* **Tight Couplings & State Map:** The `PastSelfService` is tightly coupled to `LLMService` and `EmbeddingService` via dependency injection. The Next.js API route instantiates a singleton wrapper of these services to prevent memory leaks during hot reloads.

---

## SECTION 7: API, ROUTE & WEBHOOK SPECIFICATIONS
* **`POST /api/entries`**
  * **Payload:** `{ "content": string, "createdAt"?: string }`
  * **Flow:** Generates embedding -> Raw SQL Insert -> Returns Entry.
* **`GET /api/entries`**
  * **Payload:** Query params `page`, `limit`, `startDate`, `endDate`.
  * **Response:** `{ entries: [], pagination: {} }`
* **`POST /api/past-self/query`**
  * **Payload:** `{ "query": string, "timePeriod"?: { start, end }, "preset"?: string }`
  * **Errors:** `400` (NO_ENTRIES), `429` (RATE_LIMIT_ERROR).

---

## SECTION 8: GRANULAR FUNCTION & COMPONENT BREAKDOWN
* **`PastSelfService.query(query: PastSelfQuery) -> Promise<PastSelfResponse>`**
  * *Core Logic:* Validates DB has entries -> resolves timeline (preset vs dynamic LLM extraction) -> calls `EmbeddingService.findSimilarEntries` with upper-bound date filter -> segments entries into `targetPeriodEntries` (max 4) and `earlierEntries` (max 1) -> constructs highly restrictive temporal prompt -> invokes Anthropic -> returns payload with query metadata.
* **`EmbeddingService.findSimilarEntries(...)`**
  * *Core Logic:* Executes raw Prisma `$queryRawUnsafe` injecting the vector array into PostgreSQL. Calculates `<=>` distance. Maps DB output directly to application `EntryReference` schemas, dynamically clamping distances.
* **`LLMService.extractTimePeriod(query: string)`**
  * *Core Logic:* Forces Claude to output strict JSON. Executes regex `\{[\s\S]*\}` to sanitize markdown wrappers (e.g. ````json ````) before executing `JSON.parse`.

---

## SECTION 9: TESTING & COMPLIANCE
* **Testing Suite Infrastructure:** Built rapidly using standalone execution scripts via `tsx` (e.g. `test:api`, `test:chat`, `test:db`). 
* **Critical Path Test Coverage:** Zero unit tests (expected in a 24-hour hackathon). Instead, reliance on End-to-End integration scripts hitting the live staging database to validate vector generation accuracy and LLM prompt adherence.

---

## SECTION 10: INTERVIEW STORYTELLING & SYSTEM LIMITS (STAR Method)
* **The "Hardest Technical Problem" Story:**
  * **Situation:** During the 24-hour hackathon, we built Memora to let users converse with their past selves.
  * **Task:** The core challenge was preventing the LLM from "hallucinating" the future. If a user asked their 2021 self about an event in 2023, the LLM could theoretically answer using its global knowledge or inappropriately retrieved 2023 journal entries.
  * **Action:** I engineered a strict temporal boundary at two layers. **Data Layer:** I wrote a custom raw SQL `pgvector` query that enforced an absolute hard cap (`createdAt <= timePeriod.end`), physically blocking future memories from entering the context window. **Prompt Layer:** I injected explicit system instructions overriding the LLM's default persona: `"You have NO knowledge of events after [DATE]"`.
  * **Result:** Successfully created an isolated, temporally-accurate persona that authentically reflected the user's mindset at that exact moment in history, turning a generic chat wrapper into a hyper-personalized psychological tool.
* **Architectural Trade-offs:** Utilizing Prisma alongside `pgvector`. Prisma lacks native support for vector similarity operations, forcing the use of raw SQL (`$queryRawUnsafe`). This sacrifices type safety for speed, but was necessary to meet the hackathon deadline.
* **Bottlenecks & Next Sprints:** Embedding latency. Currently, every query generates an embedding synchronously before searching. At 100x scale, this blocking operation will bottleneck the Node.js event loop. The fix: implement semantic caching (e.g., Redis) to cache vector distances for common conversational phrases or preset time boundaries.

---

## SECTION 11: PRODUCTION REALITIES & TECHNICAL RETROSPECTIVES
* **Intentional Technical Debt & Trade-offs:** 
  1. **Authentication:** Bypassed completely to ensure the limited 24 hours were spent perfecting the complex RAG and temporal boundary logic.
  2. **Error Handling:** Centralized inside Next.js routes rather than robust middleware interceptors.
* **Security & Vulnerability Retrospective:** The `POST /api/entries` and `query` endpoints currently execute without rate limits. A malicious user could spam the endpoint, causing massive financial spikes in Anthropic/Google API bills. Prioritized patch: Implementing an IP-based token-bucket rate limiter via Upstash/Redis.

---

## SECTION 12: OWNERSHIP, COLLABORATION & GOOGLINESS
* **Navigating Ambiguity:** In a 2-person hackathon team with a strict 36-hour deadline, requirements were fluid. I led the backend while my teammate owned the frontend. This required rapidly establishing strict API contracts (as seen in `ENTRY_DATA_FORMAT.md` and `FRONTEND_STRUCTURE.md`) within the first few hours, enabling decoupled, unblocked parallel development.
* **Reversible vs. Irreversible Decisions:** Choosing PostgreSQL over a dedicated vector database (like Pinecone) was a reversible decision made for speed and infrastructure simplicity (one Supabase instance). However, the unstructured text format of the `content` field is irreversible without heavy data migrations—a risk accepted to ship the MVP on time.
