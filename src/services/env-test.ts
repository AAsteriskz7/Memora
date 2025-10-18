// Environment variables test
// Run this with: npx tsx src/services/env-test.ts

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

function testEnvironmentVariables(): boolean {
  console.log('🔍 Testing Environment Variables...\n');

  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL', 
    'ANTHROPIC_API_KEY',
    'GOOGLE_API_KEY',
    'CLAUDE_MODEL',
    'GEMINI_EMBEDDING_MODEL'
  ];

  const optionalVars = [
    'NODE_ENV',
    'PORT'
  ];

  console.log('📋 Required Environment Variables:');
  let allRequiredPresent = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      console.log(`❌ ${varName}: Not set`);
      allRequiredPresent = false;
    } else if (value.includes('your_') || value.includes('_here') || value.includes('PROJECT_ID') || value.includes('YOUR_PASSWORD')) {
      console.log(`⚠️  ${varName}: Contains placeholder text`);
      console.log(`   Value: ${value.substring(0, 50)}...`);
      allRequiredPresent = false;
    } else {
      // Show partial value for security
      const displayValue = varName.includes('KEY') || varName.includes('URL') 
        ? `${value.substring(0, 20)}...` 
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  }

  console.log('\n📋 Optional Environment Variables:');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`⚪ ${varName}: Not set (optional)`);
    }
  }

  // Test database URL format
  console.log('\n🔍 Database URL Analysis:');
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      console.log(`✅ DATABASE_URL format: Valid`);
      console.log(`   Protocol: ${url.protocol}`);
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port || 'default'}`);
      console.log(`   Database: ${url.pathname.substring(1)}`);
      
      if (url.hostname.includes('supabase.com')) {
        console.log(`✅ Supabase URL detected`);
      }
    } catch (error) {
      console.log(`❌ DATABASE_URL format: Invalid - ${error}`);
      allRequiredPresent = false;
    }
  }

  if (directUrl) {
    try {
      const url = new URL(directUrl);
      console.log(`✅ DIRECT_URL format: Valid`);
      console.log(`   Host: ${url.hostname}`);
    } catch (error) {
      console.log(`❌ DIRECT_URL format: Invalid - ${error}`);
    }
  }

  // Test API key formats
  console.log('\n🔍 API Key Analysis:');
  
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    if (anthropicKey.startsWith('sk-ant-')) {
      console.log(`✅ ANTHROPIC_API_KEY: Valid format`);
    } else {
      console.log(`⚠️  ANTHROPIC_API_KEY: Unexpected format (should start with 'sk-ant-')`);
    }
  }

  const googleKey = process.env.GOOGLE_API_KEY;
  if (googleKey) {
    if (googleKey.length > 30) {
      console.log(`✅ GOOGLE_API_KEY: Valid length`);
    } else {
      console.log(`⚠️  GOOGLE_API_KEY: Seems too short`);
    }
  }

  // Test model configurations
  console.log('\n🔍 Model Configuration:');
  const claudeModel = process.env.CLAUDE_MODEL;
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL;

  console.log(`✅ Claude Model: ${claudeModel || 'claude-haiku-4.5 (default)'}`);
  console.log(`✅ Embedding Model: ${embeddingModel || 'embedding-001 (default)'}`);

  // Summary
  console.log('\n📊 Environment Status Summary:');
  if (allRequiredPresent) {
    console.log('✅ All required environment variables are properly configured');
    console.log('🚀 Ready to test database connection and AI functionality');
  } else {
    console.log('❌ Some required environment variables are missing or have placeholder values');
    console.log('🔧 Please update your .env file with actual values');
  }

  return allRequiredPresent;
}

// Test .env file loading
function testEnvFileLoading(): boolean {
  console.log('📁 Testing .env file loading...\n');

  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    
    // Read and analyze .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter((line: string) => line.trim() && !line.startsWith('#'));
    
    console.log(`✅ .env file contains ${lines.length} configuration lines`);
    
    // Check for common issues
    const issues: string[] = [];
    lines.forEach((line: string, index: number) => {
      if (line.includes(' = ')) {
        issues.push(`Line ${index + 1}: Spaces around '=' (should be VAR=value)`);
      }
      if (line.includes('your_') || line.includes('_here')) {
        issues.push(`Line ${index + 1}: Contains placeholder text`);
      }
    });
    
    if (issues.length > 0) {
      console.log('\n⚠️  .env file issues detected:');
      issues.forEach((issue: string) => console.log(`   ${issue}`));
    } else {
      console.log('✅ .env file format looks good');
    }
    
  } else {
    console.log('❌ .env file not found');
    console.log('   Create .env file by copying from .env.example');
    return false;
  }
  
  return true;
}

// Main test runner
async function runEnvTests(): Promise<void> {
  console.log('🚀 Starting Environment Configuration Tests...\n');

  try {
    // Test 1: .env file loading
    const envFileExists = testEnvFileLoading();
    if (!envFileExists) {
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Environment variables
    const envVarsValid = testEnvironmentVariables();

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Next steps
    console.log('🎯 Next Steps:');
    if (envVarsValid) {
      console.log('1. Run: npm run test:db (test database connection)');
      console.log('2. Run: npm run test:ai (test AI functionality)');
      console.log('3. Run: npm run test:real-chat (test full system)');
    } else {
      console.log('1. Fix environment variables in .env file');
      console.log('2. Re-run this test: npm run test:env');
      console.log('3. Then test database: npm run test:db');
    }

    process.exit(envVarsValid ? 0 : 1);

  } catch (error) {
    console.error('\n💥 Environment tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runEnvTests();
}

export { testEnvironmentVariables, testEnvFileLoading };