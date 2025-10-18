# Instructions for Writing Journal Entries

## What You Need to Do

Write realistic journal entries for an AI journal app. The entries should feel like real personal diary entries from someone's life between 2020-2025.

## How to Format Your Entries

### Option 1: JSON File (Easiest)
Create a file called `my-entries.json` and format it like this:

```json
[
  {
    "date": "2023-06-15",
    "content": "Your journal entry text goes here. Write it like you're writing in your own diary - personal, honest, with specific details about what happened and how you felt about it."
  },
  {
    "date": "2023-06-20", 
    "content": "Another entry here. Include real emotions, specific people and places, and authentic thoughts."
  }
]
```

### Option 2: Simple Text File
Create a file called `my-entries.txt`:

```
DATE: 2023-06-15
Your journal entry text goes here. Write it like you're writing in your own diary.

DATE: 2023-06-20
Another entry here. Include real emotions and specific details.
```

## What Makes a Good Entry

- **Personal and honest** - write like it's your private diary
- **Specific details** - mention names, places, what you ate, weather, etc.
- **Real emotions** - include both good and bad feelings
- **50-500 words** - not too short, not too long
- **Authentic voice** - use natural language, not formal writing

## Entry Ideas

**Career stuff:**
- Job interviews, promotions, difficult coworkers
- Work stress, imposter syndrome, career changes
- Remote work challenges, office politics

**Relationships:**
- Dating experiences, breakups, anniversaries  
- Family dinners, friend drama, social anxiety
- Conversations with parents, siblings, roommates

**Personal growth:**
- Therapy sessions, self-realizations, bad habits
- New hobbies, fitness goals, mental health struggles
- Books that changed your perspective

**Daily life:**
- Grocery store observations, weather complaints
- Netflix binges, cooking disasters, apartment hunting
- Random encounters with strangers

## Date Guidelines

Spread your entries across 2020-2025:
- **2020**: Pandemic stuff, lockdowns, uncertainty
- **2021**: Vaccines, reopening, relationship changes  
- **2022**: Getting back to normal, inflation stress
- **2023**: Current events, social media fatigue
- **2024-2025**: Recent thoughts, future planning

Don't write entries for every day - people don't journal daily. Cluster some entries around big events, then leave gaps.

## Example Entry

```json
{
  "date": "2022-03-15",
  "content": "Had coffee with Sarah today at that place on Main Street. She's been my best friend since college, but lately I feel like we're growing apart. She spent the whole time talking about her new promotion and her perfect boyfriend, and I just sat there nodding and feeling like a failure. I know I should be happy for her, and I am, but I also feel left behind. When did my life become so small? I used to be the ambitious one. Maybe I need to stop comparing myself to everyone else, but it's hard when social media makes it look like everyone has their shit together except me."
}
```

## What Happens Next

1. **You write the entries** in JSON or text format
2. **Send me the file** (or paste it in chat if it's short)
3. **I'll import it** using a script that handles all the technical stuff
4. **The AI will generate embeddings** and store everything in the database
5. **We'll test it** to make sure the past-self conversations work well

## Questions?

Just ask! The most important thing is that the entries feel real and personal. Don't worry about perfect formatting - I can fix technical issues. Focus on writing authentic, emotional, specific journal entries that sound like a real person's private thoughts.

## File Examples

I've created `example-entries.json` that shows the exact format. You can copy that file and replace the content with your own entries, or create a new file from scratch.

**Target:** 200-700 entries total, spread across 5 years, covering different life topics and emotional states.