// Simple Entry service test
// Run this with: npx tsx src/services/entry-test.ts

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import { createLLMService } from './llm.service';
import { createEmbeddingService } from './embedding.service';
import { createEntryService } from './entry.service';
import { prisma } from '@/lib/prisma';

async function testEntryService() {
  try {
    console.log('🧪 Testing Entry Service...');
    
    // Create service instances
    const llmService = createLLMService();
    const embeddingService = createEmbeddingService(llmService, prisma);
    const entryService = createEntryService(prisma, embeddingService);
    
    console.log('✅ Entry Service instance created successfully');
    
    // Test 1: Input validation
    console.log('\n📝 Testing input validation...');
    
    try {
      await entryService.createEntry('');
      console.log('❌ Should have thrown error for empty content');
    } catch (error) {
      console.log('✅ Correctly rejected empty content');
    }
    
    try {
      await entryService.createEntry('a'.repeat(10001));
      console.log('❌ Should have thrown error for content too long');
    } catch (error) {
      console.log('✅ Correctly rejected content over 10,000 characters');
    }
    
    try {
      await entryService.getEntryById('');
      console.log('❌ Should have thrown error for empty ID');
    } catch (error) {
      console.log('✅ Correctly rejected empty ID');
    }
    
    try {
      await entryService.getEntries({ page: 0 });
      console.log('❌ Should have thrown error for page 0');
    } catch (error) {
      console.log('✅ Correctly rejected page 0');
    }
    
    try {
      await entryService.getEntries({ limit: 101 });
      console.log('❌ Should have thrown error for limit > 100');
    } catch (error) {
      console.log('✅ Correctly rejected limit > 100');
    }
    
    // Test 2: Check if API key is configured
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
      console.log('\n⚠️  GOOGLE_API_KEY not configured - skipping API tests');
      console.log('   Set GOOGLE_API_KEY in .env to test actual API calls');
      return;
    }
    
    // Test 3: Database connection
    console.log('\n🔌 Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection established');
      
      // Test 4: CRUD operations
      console.log('\n📝 Testing CRUD operations...');
      
      // Create entry
      const testContent = 'This is a test journal entry created at ' + new Date().toISOString();
      console.log('Creating test entry...');
      const createdEntry = await entryService.createEntry(testContent);
      console.log(`✅ Created entry with ID: ${createdEntry.id}`);
      console.log(`   Content: "${createdEntry.content.substring(0, 50)}..."`);
      console.log(`   Created: ${createdEntry.createdAt.toISOString()}`);
      
      // Get entry by ID
      console.log('\nRetrieving entry by ID...');
      const retrievedEntry = await entryService.getEntryById(createdEntry.id);
      if (retrievedEntry && retrievedEntry.id === createdEntry.id) {
        console.log('✅ Successfully retrieved entry by ID');
      } else {
        console.log('❌ Failed to retrieve entry by ID');
      }
      
      // Update entry
      console.log('\nUpdating entry...');
      const updatedContent = testContent + ' - UPDATED';
      const updatedEntry = await entryService.updateEntry(createdEntry.id, updatedContent);
      console.log(`✅ Updated entry content`);
      console.log(`   New content: "${updatedEntry.content.substring(0, 50)}..."`);
      console.log(`   Updated: ${updatedEntry.updatedAt.toISOString()}`);
      
      // Get entries with pagination
      console.log('\nTesting pagination...');
      const entriesPage1 = await entryService.getEntries({ page: 1, limit: 5 });
      console.log(`✅ Retrieved ${entriesPage1.entries.length} entries (page 1)`);
      console.log(`   Total entries: ${entriesPage1.pagination.total}`);
      console.log(`   Total pages: ${entriesPage1.pagination.totalPages}`);
      
      // Test date filtering
      console.log('\nTesting date filtering...');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentEntries = await entryService.getEntries({
        startDate: yesterday,
        endDate: today,
        limit: 10
      });
      console.log(`✅ Found ${recentEntries.entries.length} entries from last 24 hours`);
      
      // Test search by date range
      console.log('\nTesting date range search...');
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weekEntries = await entryService.searchEntriesByDateRange(oneWeekAgo, today);
      console.log(`✅ Found ${weekEntries.length} entries from last week`);
      
      // Test non-existent entry
      console.log('\nTesting non-existent entry retrieval...');
      const nonExistentEntry = await entryService.getEntryById('00000000-0000-0000-0000-000000000000');
      if (nonExistentEntry === null) {
        console.log('✅ Correctly returned null for non-existent entry');
      } else {
        console.log('❌ Should have returned null for non-existent entry');
      }
      
      // Clean up - delete test entry
      console.log('\nCleaning up test entry...');
      await entryService.deleteEntry(createdEntry.id);
      console.log('✅ Successfully deleted test entry');
      
      // Verify deletion
      const deletedEntry = await entryService.getEntryById(createdEntry.id);
      if (deletedEntry === null) {
        console.log('✅ Confirmed entry was deleted');
      } else {
        console.log('❌ Entry still exists after deletion');
      }
      
    } catch (dbError) {
      console.log(`❌ Database operation failed: ${dbError}`);
    }
    
    console.log('\n🎉 Entry Service tests completed!');
    
  } catch (error) {
    console.error('❌ Entry Service test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testEntryService();
}