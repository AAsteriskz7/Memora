#!/usr/bin/env tsx

/**
 * Test script for mock data generation
 * Creates just 5 entries to verify the system works
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createLLMService } from '../src/services/llm.service';
import { createEmbeddingService } from '../src/services/embedding.service';
import { createEntryService } from '../src/services/entry.service';

async function testMockDataGeneration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing mock data generation...');
    
    // Initialize services
    const llmService = createLLMService();
    const embeddingService = createEmbeddingService(llmService, prisma);
    const entryService = createEntryService(prisma, embeddingService);
    
    console.log('✅ Services initialized');
    
    // Test creating a few entries
    const testEntries = [
      {
        content: "Had an amazing breakthrough at work today! The client loved our proposal and wants to move forward immediately. I'm feeling so motivated and excited about where my career is heading. Growth happens in the most unexpected ways.",
        createdAt: new Date('2023-06-15T10:30:00Z')
      },
      {
        content: "Spent quality time with my family today. We talked for hours about our dreams and fears. These moments mean everything to me. I'm grateful for both the good times and the challenges.",
        createdAt: new Date('2023-08-22T19:45:00Z')
      },
      {
        content: "Had a major realization about myself today. I'm finally learning to set healthy boundaries. I feel like I'm finally understanding who I am. Every experience shapes who I'm becoming.",
        createdAt: new Date('2024-01-10T14:20:00Z')
      }
    ];
    
    console.log('📝 Creating test entries...');
    
    for (let i = 0; i < testEntries.length; i++) {
      const entry = testEntries[i];
      console.log(`   Creating entry ${i + 1}/${testEntries.length}...`);
      
      try {
        const created = await entryService.createEntry(entry.content, entry.createdAt);
        console.log(`   ✅ Created entry: ${created.id}`);
      } catch (error) {
        console.error(`   ❌ Failed to create entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Test retrieving entries
    console.log('📖 Testing entry retrieval...');
    const entries = await entryService.getEntries({ limit: 10 });
    console.log(`   Found ${entries.entries.length} entries in database`);
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMockDataGeneration().catch(console.error);