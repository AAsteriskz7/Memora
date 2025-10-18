#!/usr/bin/env tsx

/**
 * Database setup helper script
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function setupDatabase() {
  console.log('🗄️  Database Setup Helper');
  console.log('========================\n');
  
  const currentUrl = process.env.DATABASE_URL;
  
  if (!currentUrl) {
    console.log('❌ No DATABASE_URL found in .env file');
    console.log('\n💡 You need to set up a database. Here are your options:\n');
    
    console.log('1. 🌐 Supabase (Recommended - Free tier available)');
    console.log('   - Go to https://supabase.com');
    console.log('   - Create a new project');
    console.log('   - Go to Settings > Database');
    console.log('   - Copy the connection string');
    console.log('   - Add it to your .env file as DATABASE_URL\n');
    
    console.log('2. 🐘 Local PostgreSQL');
    console.log('   - Install PostgreSQL locally');
    console.log('   - Create a database called "memora"');
    console.log('   - Use: DATABASE_URL="postgresql://username:password@localhost:5432/memora"\n');
    
    console.log('3. 🐳 Docker PostgreSQL');
    console.log('   - Run: docker run --name memora-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=memora -p 5432:5432 -d postgres');
    console.log('   - Use: DATABASE_URL="postgresql://postgres:password@localhost:5432/memora"\n');
    
    return;
  }
  
  console.log(`📍 Current DATABASE_URL: ${currentUrl.replace(/:[^:@]*@/, ':****@')}\n`);
  
  // Test connection
  console.log('🔌 Testing database connection...');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Check if tables exist
    console.log('🏗️  Checking database schema...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      ` as any[];
      
      const tableNames = tables.map((t: any) => t.table_name);
      
      if (tableNames.includes('entries')) {
        console.log('✅ Tables exist and are ready');
        
        const count = await prisma.entry.count();
        console.log(`📊 Current entries in database: ${count}`);
        
        if (count === 0) {
          console.log('\n💡 Database is ready for data! You can now:');
          console.log('   - Run: npm run seed:mock (generate template entries)');
          console.log('   - Run: npm run import:entries your-file.json (import custom entries)');
        } else {
          console.log('\n✅ Database has data and is ready to use!');
        }
        
      } else {
        console.log('⚠️  Tables not found. Running migrations...');
        
        // Import and run migrations programmatically would be complex
        // Better to instruct user to run the command
        console.log('\n💡 Please run the following command to create tables:');
        console.log('   npm run db:migrate');
        console.log('\nThen run this script again to verify setup.');
      }
      
    } catch (error) {
      console.log('⚠️  Could not check schema. You may need to run migrations:');
      console.log('   npm run db:migrate');
    }
    
  } catch (error) {
    console.log('❌ Database connection failed');
    
    if (error instanceof Error) {
      console.log(`   Error: ${error.message.split('\n')[0]}\n`);
      
      if (error.message.includes('Authentication failed')) {
        console.log('💡 Authentication issue - check your credentials');
      } else if (error.message.includes('Can\'t reach database server')) {
        console.log('💡 Server unreachable - check your connection or database status');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('💡 Database exists but may need setup');
      }
      
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Verify your DATABASE_URL is correct');
      console.log('2. Check if your database service is running');
      console.log('3. For Supabase: check if project is paused');
      console.log('4. For local DB: ensure PostgreSQL is running');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase().catch(console.error);