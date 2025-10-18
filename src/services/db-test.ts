// Database connection test
// Run this with: npx tsx src/services/db-test.ts

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { prisma } from '@/lib/prisma';

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // Test basic connection
    console.log('1️⃣ Testing Prisma connection...');
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');

    // Test query execution
    console.log('\n2️⃣ Testing database query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query executed successfully:', result);

    // Test entry table access
    console.log('\n3️⃣ Testing entry table access...');
    const entryCount = await prisma.entry.count();
    console.log(`✅ Entry table accessible - found ${entryCount} entries`);

    // Test entry retrieval
    if (entryCount > 0) {
      console.log('\n4️⃣ Testing entry retrieval...');
      const sampleEntry = await prisma.entry.findFirst({
        select: {
          id: true,
          content: true,
          createdAt: true
        }
      });
      console.log('✅ Entry retrieval successful');
      console.log(`   Sample entry: "${sampleEntry?.content?.substring(0, 50)}..."`);
      console.log(`   Created: ${sampleEntry?.createdAt}`);
    }

    console.log('\n🎉 Database connection test completed successfully!');
    console.log('\n📊 Database Status:');
    console.log(`   Total entries: ${entryCount}`);
    console.log('   Connection: ✅ Working');
    console.log('   Queries: ✅ Working');

  } catch (error) {
    console.error('\n❌ Database connection test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Tenant or user not found')) {
        console.log('\n🔧 Database Connection Issue Detected:');
        console.log('   Problem: Supabase tenant/user not found');
        console.log('   Solution: Check your .env file database credentials');
        console.log('   Required variables:');
        console.log('     - DATABASE_URL (pooled connection)');
        console.log('     - DIRECT_URL (direct connection)');
        console.log('\n   Make sure your Supabase project is active and credentials are correct.');
      } else if (error.message.includes('connection')) {
        console.log('\n🔧 Network Connection Issue:');
        console.log('   Problem: Cannot connect to database');
        console.log('   Check: Internet connection and Supabase status');
      } else {
        console.log('\n🔧 Unknown Database Error:');
        console.log(`   Error: ${error.message}`);
      }
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testDatabaseConnection };