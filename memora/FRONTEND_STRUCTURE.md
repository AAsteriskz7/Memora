# Frontend Code Structure Guide

## Where to Add Your Frontend Code

### Next.js App Router Structure

```
memora/src/
├── app/                          # Next.js App Router (pages & API routes)
│   ├── api/                      # ✅ API routes (already done - don't touch)
│   ├── page.tsx                  # 🎨 Home page (edit this)
│   ├── layout.tsx                # 🎨 Root layout (edit for global UI)
│   ├── globals.css               # 🎨 Global styles (edit this)
│   │
│   ├── entries/                  # 📝 CREATE THIS - Entry pages
│   │   ├── page.tsx              # Entry list page
│   │   ├── new/
│   │   │   └── page.tsx          # New entry form
│   │   └── [id]/
│   │       ├── page.tsx          # View/edit entry
│   │       └── edit/
│   │           └── page.tsx      # Edit entry (optional)
│   │
│   ├── past-self/                # 💬 CREATE THIS - Chat interface
│   │   └── page.tsx              # Past-self conversation page
│   │
│   └── settings/                 # ⚙️ CREATE THIS - Settings
│       └── page.tsx              # Settings page
│
├── components/                   # 🎨 CREATE THIS - React components
│   ├── ui/                       # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── entries/                  # Entry-related components
│   │   ├── EntryCard.tsx
│   │   ├── EntryList.tsx
│   │   ├── EntryForm.tsx
│   │   └── EntryEditor.tsx
│   ├── past-self/                # Chat-related components
│   │   ├── ChatInterface.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── TimePeriodSelector.tsx
│   │   └── EntryReference.tsx
│   └── layout/                   # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
│
├── lib/                          # 🔧 CREATE THIS - Client utilities
│   ├── api.ts                    # API client functions
│   ├── utils.ts                  # Helper functions
│   └── constants.ts              # Constants
│
├── hooks/                        # 🪝 CREATE THIS - Custom React hooks
│   ├── useEntries.ts
│   ├── usePastSelf.ts
│   └── useDebounce.ts
│
├── types/                        # ✅ TypeScript types (already exists)
│   └── index.ts                  # Use these types in your frontend
│
├── services/                     # ✅ Backend services (don't touch)
└── utils/                        # ✅ Backend utilities (don't touch)
```

## Step-by-Step: Where to Start

### 1. Edit the Home Page
**File**: `src/app/page.tsx`

This is your landing page. Replace the default Next.js content with your design.

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>Welcome to Memora</h1>
      {/* Your home page content */}
    </main>
  );
}
```

### 2. Create Components Directory
**Create**: `src/components/`

This is where all your React components go.

```bash
mkdir src/components
mkdir src/components/ui
mkdir src/components/entries
mkdir src/components/past-self
mkdir src/components/layout
```

### 3. Create Entry Pages
**Create**: `src/app/entries/`

```bash
mkdir src/app/entries
mkdir src/app/entries/new
mkdir src/app/entries/[id]
```

**Example - Entry List Page**:
```tsx
// src/app/entries/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { JournalEntry, PaginatedResponse } from '@/types';

export default function EntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  
  useEffect(() => {
    fetch('/api/entries?limit=20')
      .then(res => res.json())
      .then((data: PaginatedResponse<JournalEntry>) => {
        setEntries(data.entries);
      });
  }, []);

  return (
    <div>
      <h1>My Journal Entries</h1>
      {entries.map(entry => (
        <div key={entry.id}>
          <p>{entry.content}</p>
          <small>{new Date(entry.createdAt).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}
```

### 4. Create Past-Self Chat Page
**Create**: `src/app/past-self/`

```bash
mkdir src/app/past-self
```

**Example - Chat Page**:
```tsx
// src/app/past-self/page.tsx
'use client';

import { useState } from 'react';
import { PastSelfResponse } from '@/types';

export default function PastSelfPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<PastSelfResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('/api/past-self/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, preset: '1-year-ago' })
    });
    
    const data = await res.json();
    setResponse(data);
  };

  return (
    <div>
      <h1>Talk to Your Past Self</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your past self..."
        />
        <button type="submit">Ask</button>
      </form>
      
      {response && (
        <div>
          <p>{response.response}</p>
          <div>
            {response.references.map(ref => (
              <div key={ref.entryId}>
                <p>{ref.excerpt}</p>
                <small>{new Date(ref.date).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5. Create API Client Library
**Create**: `src/lib/api.ts`

```bash
mkdir src/lib
```

```typescript
// src/lib/api.ts
import { JournalEntry, PaginatedResponse, PastSelfResponse } from '@/types';

export const api = {
  // Get entries
  async getEntries(page = 1, limit = 20) {
    const res = await fetch(`/api/entries?page=${page}&limit=${limit}`);
    return res.json() as Promise<PaginatedResponse<JournalEntry>>;
  },

  // Create entry
  async createEntry(content: string, createdAt?: Date) {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, createdAt: createdAt?.toISOString() })
    });
    return res.json() as Promise<JournalEntry>;
  },

  // Query past self
  async queryPastSelf(query: string, preset?: string) {
    const res = await fetch('/api/past-self/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, preset })
    });
    return res.json() as Promise<PastSelfResponse>;
  }
};
```

### 6. Create Custom Hooks
**Create**: `src/hooks/`

```bash
mkdir src/hooks
```

```typescript
// src/hooks/useEntries.ts
import { useState, useEffect } from 'react';
import { JournalEntry } from '@/types';
import { api } from '@/lib/api';

export function useEntries(page = 1) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEntries(page)
      .then(data => setEntries(data.entries))
      .finally(() => setLoading(false));
  }, [page]);

  return { entries, loading };
}
```

## Important Rules

### ✅ DO:
- Create new files in `src/app/` for pages
- Create components in `src/components/`
- Use types from `src/types/index.ts`
- Create utilities in `src/lib/`
- Edit `src/app/page.tsx` for home page
- Edit `src/app/layout.tsx` for global layout
- Edit `src/app/globals.css` for global styles

### ❌ DON'T:
- Touch anything in `src/app/api/` (backend API routes)
- Modify files in `src/services/` (backend services)
- Change files in `src/utils/` (backend utilities)
- Edit `prisma/` directory (database schema)

## Quick Reference: File Locations

| What | Where | Example |
|------|-------|---------|
| Pages | `src/app/*/page.tsx` | `src/app/entries/page.tsx` |
| Components | `src/components/` | `src/components/ui/Button.tsx` |
| API Client | `src/lib/api.ts` | API wrapper functions |
| Custom Hooks | `src/hooks/` | `src/hooks/useEntries.ts` |
| Types | `src/types/index.ts` | Import existing types |
| Styles | `src/app/globals.css` or component CSS modules | |
| Layout | `src/app/layout.tsx` | Root layout wrapper |

## Example Component Structure

```tsx
// src/components/entries/EntryCard.tsx
import { JournalEntry } from '@/types';

interface EntryCardProps {
  entry: JournalEntry;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  return (
    <div className="entry-card">
      <p>{entry.content}</p>
      <div className="entry-meta">
        <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
        {onEdit && <button onClick={() => onEdit(entry.id)}>Edit</button>}
        {onDelete && <button onClick={() => onDelete(entry.id)}>Delete</button>}
      </div>
    </div>
  );
}
```

## Next Steps

1. ✅ Read this guide
2. 🎨 Edit `src/app/page.tsx` to create your home page
3. 📁 Create `src/components/` directory
4. 🔧 Create `src/lib/api.ts` for API calls
5. 📝 Create `src/app/entries/page.tsx` for entry list
6. 💬 Create `src/app/past-self/page.tsx` for chat
7. 🎨 Add your styling (Tailwind, CSS Modules, etc.)

The backend is ready - now build the UI! 🚀