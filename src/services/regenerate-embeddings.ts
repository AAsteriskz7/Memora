// Regenerate embeddings for all entries
// Run this with: npx tsx src/services/regenerate-embeddings.ts

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { prisma } from "@/lib/prisma";
import { createLLMService } from "./llm.service";
import { createEmbeddingService } from "./embedding.service";

interface EntryWithEmbedding {
  id: string;
  content: string;
  embedding_dimensions: number | null;
}

async function regenerateAllEmbeddings() {
  console.log("🔄 Regenerating All Embeddings...\n");
  console.log("🔍 Environment check:");
  console.log(
    `   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "Set" : "Missing"}`
  );
  console.log(
    `   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? "Set" : "Missing"}`
  );
  console.log(
    `   DATABASE_URL: ${process.env.DATABASE_URL ? "Set" : "Missing"}\n`
  );

  try {
    // Initialize services
    const llmService = createLLMService();
    const embeddingService = createEmbeddingService(llmService, prisma);

    // Get all entries and check their embedding dimensions using raw SQL
    console.log("📊 Checking existing entries...");

    const allEntries = await prisma.$queryRaw<EntryWithEmbedding[]>`
      SELECT 
        id, 
        content,
        CASE 
          WHEN embedding IS NULL THEN NULL
          ELSE vector_dims(embedding)
        END as embedding_dimensions
      FROM entries
      ORDER BY "createdAt" DESC
    `;

    console.log(`✅ Found ${allEntries.length} total entries`);

    // Analyze embedding dimensions
    let entriesWithoutEmbeddings = 0;
    let entriesWithOldEmbeddings = 0;
    let entriesWithCorrectEmbeddings = 0;

    for (const entry of allEntries) {
      if (entry.embedding_dimensions === null) {
        entriesWithoutEmbeddings++;
      } else if (entry.embedding_dimensions === 768) {
        entriesWithOldEmbeddings++;
      } else if (entry.embedding_dimensions === 3072) {
        entriesWithCorrectEmbeddings++;
      }
    }

    console.log(`📈 Embedding Status:`);
    console.log(`   Without embeddings: ${entriesWithoutEmbeddings}`);
    console.log(`   Old embeddings (768d): ${entriesWithOldEmbeddings}`);
    console.log(
      `   Correct embeddings (3072d): ${entriesWithCorrectEmbeddings}`
    );

    const entriesToUpdate = entriesWithoutEmbeddings + entriesWithOldEmbeddings;

    if (entriesToUpdate === 0) {
      console.log("\n✅ All embeddings are already up to date!");
      return;
    }

    console.log(`\n🔄 Need to regenerate ${entriesToUpdate} embeddings...`);

    // Clear all existing embeddings first to avoid dimension conflicts
    console.log(
      "\n🔧 Clearing existing embeddings to avoid dimension conflicts..."
    );
    await prisma.$executeRaw`
      UPDATE entries SET embedding = NULL
    `;
    console.log("✅ Cleared all existing embeddings");

    // Update database schema to support 3072 dimensions
    console.log("\n🔧 Updating database schema for 3072 dimensions...");
    try {
      await prisma.$executeRaw`
        ALTER TABLE entries 
        ALTER COLUMN embedding TYPE vector(3072)
      `;
      console.log("✅ Database schema updated to support 3072 dimensions");
    } catch (error) {
      console.log("⚠️  Schema update failed, trying to recreate column...");
      try {
        await prisma.$executeRaw`
          ALTER TABLE entries DROP COLUMN embedding
        `;
        await prisma.$executeRaw`
          ALTER TABLE entries ADD COLUMN embedding vector(3072)
        `;
        console.log("✅ Recreated embedding column with 3072 dimensions");
      } catch (recreateError) {
        console.log("❌ Failed to update schema:", recreateError);
        throw recreateError;
      }
    }

    // Regenerate embeddings in batches
    const batchSize = 5; // Smaller batches to be safe with API limits
    let processed = 0;

    for (let i = 0; i < allEntries.length; i += batchSize) {
      const batch = allEntries.slice(i, i + batchSize);

      for (const entry of batch) {
        // Skip entries that already have correct embeddings
        if (entry.embedding_dimensions === 3072) {
          continue;
        }

        try {
          console.log(
            `🔄 Processing entry ${processed + 1}/${entriesToUpdate}:`
          );
          console.log(`   Content: "${entry.content.substring(0, 80)}..."`);

          // Generate new embedding using Gemini
          const newEmbedding = await embeddingService.generateEmbedding(
            entry.content
          );

          // Update in database using raw SQL
          await prisma.$executeRaw`
            UPDATE entries 
            SET embedding = ${newEmbedding}::vector
            WHERE id = ${entry.id}
          `;

          processed++;
          console.log(
            `✅ Updated embedding (${newEmbedding.length} dimensions)`
          );

          // Small delay to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`❌ Failed to update entry ${entry.id}: ${error}`);
        }
      }

      // Longer delay between batches
      if (i + batchSize < allEntries.length) {
        console.log(
          `⏳ Batch complete, waiting 3 seconds before next batch...`
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log(`\n🎉 Regeneration complete!`);
    console.log(`✅ Updated ${processed} embeddings`);
    console.log(
      `📊 All embeddings now use 3072 dimensions (Gemini embedding-001)`
    );
    console.log(`\n🚀 Ready to test chat functionality!`);
    console.log(`Run: npm run test:real-chat`);
  } catch (error) {
    console.error("\n❌ Embedding regeneration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run regeneration if this file is executed directly
if (require.main === module) {
  regenerateAllEmbeddings()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { regenerateAllEmbeddings };
