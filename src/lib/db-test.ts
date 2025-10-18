// Simple database connection test
// Run this with: npx tsx src/lib/db-test.ts

import { prisma } from './prisma'

async function testConnection() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test if entries table exists by attempting to count records
    const count = await prisma.entry.count()
    console.log(`✅ Entries table accessible. Current count: ${count}`)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testConnection()
}