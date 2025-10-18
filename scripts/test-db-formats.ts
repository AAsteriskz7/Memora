#!/usr/bin/env tsx

/**
 * Test different database URL formats
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function testDatabaseFormats() {
  const originalUrl = process.env.DATABASE_URL;
  
  if (!originalUrl) {
    console.error('❌ No DATABASE_URL found in environment');
    return;
  }
  
  console.log('🔌 Testing different database connection formats...');
  console.log(`📍 Original URL: ${originalUrl.replace(/:[^:@]*@/, ':****@')}`);
  
  // Test original URL
  await testConnection('Original URL', originalUrl);
  
  // Try direct connection (replace pooler with direct)
  const directUrl = originalUrl.replace('aws-1-us-east-1.pooler.supabase.com', 'aws-1-us-east-1.compute.amazonaws.com');
  if (directUrl !== originalUrl) {
    await testConnection('Direct connection', directUrl);
  }
  
  // Try different port
  const port6543Url = originalUrl.replace(':5432', ':6543');
  if (port6543Url !== originalUrl) {
    await testConnection('Port 6543', port6543Url);
  }
  
  // Try removing brackets from password
  const noBracketsUrl = originalUrl.replace('[', '').replace(']', '');
  if (noBracketsUrl !== originalUrl) {
    await testConnection('No brackets in password', noBracketsUrl);
  }
}

async function testConnection(label: string, url: string): Promise<void> {
  console.log(`\n🧪 Testing ${label}...`);
  console.log(`   URL: ${url.replace(/:[^:@]*@/, ':****@')}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('   ✅ Connection successful!');
    
    // Quick test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Query successful:', result);
    
    await prisma.$disconnect();
    
    console.log(`\n🎉 SUCCESS! Use this URL format:`);
    console.log(`DATABASE_URL=${url}`);
    return;
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message.split('\n')[0] : 'Unknown error'}`);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

testDatabaseFormats().catch(console.error);