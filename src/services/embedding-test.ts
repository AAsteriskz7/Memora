// Simple Embedding service test
// Run this with: npx tsx src/services/embedding-test.ts

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import { createLLMService } from './llm.service';
import { createEmbeddingService } from './embedding.service';
import { prisma } from '@/lib/prisma';

async function testEmbeddingService() {
  try {
    console.log('🧪 Testing Embedding Service...');
    
    // Create service instances
    const llmService = createLLMService();
    const embeddingService = createEmbeddingService(llmService, prisma);
    
    console.log('✅ Embedding Service instance created successfully');
    
    // Test 1: Input validation
    console.log('\n📝 Testing input validation...');
    
    try {
      await embeddingService.generateEmbedding('');
      console.log('❌ Should have thrown error for empty text');
    } catch {
      console.log('✅ Correctly rejected empty text for embedding');
    }
    
    try {
      await embeddingService.findSimilarEntries([]);
      console.log('❌ Should have thrown error for empty embedding');
    } catch {
      console.log('✅ Correctly rejected empty embedding array');
    }
    
    try {
      await embeddingService.findSimilarEntries([0.1, 0.2, 0.3], 0);
      console.log('❌ Should have thrown error for zero limit');
    } catch {
      console.log('✅ Correctly rejected zero limit');
    }
    
    // Test 2: Check if API key is configured
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
      console.log('\n⚠️  GOOGLE_API_KEY not configured - skipping API tests');
      console.log('   Set GOOGLE_API_KEY in .env to test actual API calls');
      return;
    }
    
    // Test 3: Generate embedding wrapper
    console.log('\n🔢 Testing embedding generation wrapper...');
    try {
      const embedding = await embeddingService.generateEmbedding('This is a test sentence for embedding.');
      console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
      console.log(`   First few values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
      
      // Test 4: Find similar entries (requires database connection)
      console.log('\n🔍 Testing similar entries search...');
      try {
        await prisma.$connect();
        console.log('✅ Database connection established');
        
        // Check if we have any entries in the database
        const entryCount = await prisma.entry.count();
        console.log(`📊 Found ${entryCount} entries in database`);
        
        if (entryCount > 0) {
          // Test similarity search
          const similarEntries = await embeddingService.findSimilarEntries(embedding, 3);
          console.log(`✅ Found ${similarEntries.length} similar entries`);
          
          similarEntries.forEach((entry, index) => {
            console.log(`   ${index + 1}. Entry ${entry.entryId.substring(0, 8)}... (Score: ${entry.relevanceScore})`);
            console.log(`      Date: ${entry.date.toISOString()}`);
            console.log(`      Excerpt: "${entry.excerpt.substring(0, 50)}..."`);
          });
          
          // Test with time period filtering
          console.log('\n📅 Testing time period filtering...');
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const filteredEntries = await embeddingService.findSimilarEntries(
            embedding, 
            3, 
            { start: oneYearAgo, end: new Date() }
          );
          console.log(`✅ Found ${filteredEntries.length} entries from last year`);
          
        } else {
          console.log('⚠️  No entries in database - skipping similarity search tests');
          console.log('   Add some entries to test similarity search functionality');
        }
        
      } catch (dbError) {
        console.log(`❌ Database operation failed: ${dbError}`);
      }
      
    } catch (error) {
      console.log(`❌ Embedding generation failed: ${error}`);
    }
    
    console.log('\n🎉 Embedding Service tests completed!');
    
  } catch (error) {
    console.error('❌ Embedding Service test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testEmbeddingService();
}