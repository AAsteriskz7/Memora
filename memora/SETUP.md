# Supabase Database Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project name (e.g., "memora-journal")
5. Enter a secure database password
6. Choose a region close to you
7. Click "Create new project"

## 2. Get Connection String

1. In your Supabase dashboard, go to **Settings** > **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

## 3. Update Environment Variables

1. Open the `.env` file in the memora directory
2. Replace the `DATABASE_URL` with your actual connection string from step 2
3. Make sure to replace `[YOUR-PASSWORD]` with your actual database password

## 4. Enable pgvector Extension (Already Done)

Supabase has pgvector pre-installed, so no additional setup is needed.

## 5. Run Database Migration

Once you've updated your `.env` file with the correct DATABASE_URL, run:

```bash
cd memora
npx prisma migrate deploy
```

This will create the `entries` table with the vector field for embeddings.

## 6. Verify Setup

You can verify the setup by running:

```bash
npx prisma studio
```

This will open Prisma Studio where you can view your database tables.

## Troubleshooting

- **Connection Error**: Make sure your DATABASE_URL is correct and your Supabase project is running
- **Migration Error**: Ensure pgvector extension is enabled (it should be by default in Supabase)
- **Permission Error**: Make sure your database user has the necessary permissions

## Next Steps

After completing the database setup, you can proceed to implement the LLM service and other components as outlined in the tasks.md file.