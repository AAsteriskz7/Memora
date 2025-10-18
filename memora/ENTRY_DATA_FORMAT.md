# How to Store Journal Entries for Mock Data

## Simple Format Options

### Option 1: JSON File (Recommended)
Create a file called `journal-entries.json`:

```json
[
  {
    "date": "2023-06-15",
    "content": "Had an amazing breakthrough at work today! The client loved our proposal and wants to move forward immediately. I'm feeling so motivated and excited about where my career is heading. Sometimes it's the simple victories that remind you why you chose this path."
  },
  {
    "date": "2023-06-18", 
    "content": "Spent the weekend with Mom and Dad. It's crazy how being back in my childhood home makes me feel like I'm 16 again. We had a long talk about my career choices over dinner. Dad finally admitted he's proud of me, which honestly made me tear up a little."
  },
  {
    "date": "2023-06-22",
    "content": "Therapy session was intense today. Dr. Martinez helped me see how I always apologize for taking up space, even in my own life. It's connected to that thing Mom used to say about being 'too much.' I'm 28 and still hearing her voice in my head, but at least now I recognize it."
  }
]
```

### Option 2: CSV File
Create a file called `journal-entries.csv`:

```csv
date,content
2023-06-15,"Had an amazing breakthrough at work today! The client loved our proposal and wants to move forward immediately. I'm feeling so motivated and excited about where my career is heading."
2023-06-18,"Spent the weekend with Mom and Dad. It's crazy how being back in my childhood home makes me feel like I'm 16 again. We had a long talk about my career choices over dinner."
2023-06-22,"Therapy session was intense today. Dr. Martinez helped me see how I always apologize for taking up space, even in my own life."
```

### Option 3: Simple Text File
Create a file called `journal-entries.txt`:

```
DATE: 2023-06-15
Had an amazing breakthrough at work today! The client loved our proposal and wants to move forward immediately. I'm feeling so motivated and excited about where my career is heading.

DATE: 2023-06-18
Spent the weekend with Mom and Dad. It's crazy how being back in my childhood home makes me feel like I'm 16 again. We had a long talk about my career choices over dinner.

DATE: 2023-06-22
Therapy session was intense today. Dr. Martinez helped me see how I always apologize for taking up space, even in my own life.
```

## What You Need to Provide

### Required Fields
- **date**: YYYY-MM-DD format (e.g., "2023-06-15")
- **content**: The actual journal entry text

### Optional Fields (if using JSON)
- **topic**: career, relationships, personal_growth, daily_life, travel, health
- **mood**: positive, negative, neutral
- **length**: short, medium, long

## Date Guidelines

**Spread entries across 2020-2025:**
- 2020: 100-120 entries (pandemic year, more introspection)
- 2021: 120-140 entries (recovery, change)
- 2022: 140-160 entries (post-pandemic adjustment)
- 2023: 140-160 entries (current events, growth)
- 2024: 100-120 entries (recent past)
- 2025: 40-60 entries (near future)

**Date distribution tips:**
- More entries during stressful periods (job changes, breakups, etc.)
- Fewer entries during busy/happy periods
- Cluster some entries (like processing a big event over several days)
- Leave gaps (people don't journal every day)

## File Naming

If creating multiple files:
- `entries-2020.json`
- `entries-2021.json` 
- `entries-2022.json`
- etc.

Or by topic:
- `career-entries.json`
- `relationship-entries.json`
- `personal-growth-entries.json`

## How We'll Import Your Data

Once you provide the entries, I'll create a script that:

1. **Reads your file(s)** (JSON, CSV, or text)
2. **Validates the format** (checks dates, content length)
3. **Generates embeddings** for each entry using the AI
4. **Seeds the database** with your entries

## Example Script Usage

```bash
# After you provide the entries file
npm run import:entries journal-entries.json

# Or multiple files
npm run import:entries entries-2020.json entries-2021.json entries-2022.json
```

## Quality Checklist for Your Entries

Before submitting, make sure:
- [ ] Dates are in YYYY-MM-DD format
- [ ] Each entry is 50-800 words
- [ ] Content feels authentic and personal
- [ ] No special characters that break JSON (if using JSON)
- [ ] Entries span the full 2020-2025 period
- [ ] Good mix of topics and emotional tones

## Submission Options

**Send me:**
1. A single JSON file with all entries, OR
2. Multiple files organized by year/topic, OR  
3. A Google Doc/Sheet with the data, OR
4. Just paste the entries in our chat (if not too many)

**I'll handle:**
- Converting to the right format
- Creating the import script
- Generating embeddings
- Seeding the database
- Testing the data quality

## Example Complete Entry (JSON format)

```json
{
  "date": "2022-03-15",
  "content": "Another Zoom meeting that could have been an email. I swear, remote work has some benefits but the meeting culture has gotten completely out of hand. Sarah and I were texting each other during the 'brainstorming session' - she sent me a meme about corporate buzzwords and I almost lost it trying not to laugh. At least we're in this together. Sometimes I miss the office though. There was something about those random hallway conversations that you just can't replicate virtually. Maybe that's just nostalgia talking. The commute definitely doesn't miss me.",
  "topic": "career",
  "mood": "neutral"
}
```

Just focus on writing great, authentic entries - I'll handle all the technical stuff!