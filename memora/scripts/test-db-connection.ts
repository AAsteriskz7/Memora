#!/usr/bin/env tsx

/**
 * Simple database connection test
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testing database connection...');
    console.log(`📍 Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')}`);
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test query execution
    console.log('🔍 Testing query execution...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query execution successful:', result);
    
    // Test table access
    console.log('📊 Testing table access...');
    const count = await prisma.entry.count();
    console.log(`✅ Entry table accessible, current count: ${count}`);
    
    // Test table structure
    console.log('🏗️  Testing table structure...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'entries'
      ORDER BY ordinal_position
    `;
    console.log('✅ Table structure:', tableInfo);
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication failed')) {
        console.log('\n💡 Troubleshooting tips:');
        console.log('   1. Check if the database password is correct');
        console.log('   2. Verify the database URL format');
        console.log('   3. Ensure the database server is running');
        console.log('   4. Check if your IP is whitelisted (for cloud databases)');
      } else if (error.message.includes('does not exist')) {
        console.log('\n💡 The database exists but tables may not be created yet.');
        console.log('   Run: npm run db:migrate');
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection().catch(console.error);