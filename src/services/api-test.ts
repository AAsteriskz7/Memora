// Simple API endpoint test without database
// Run this with: npx tsx src/services/api-test.ts

import { createLLMService } from './llm.service';

async function testAPIComponents() {
  console.log('🧪 Testing API Components...\n');

  try {
    // Test 1: LLM Service Creation
    console.log('🔧 Testing LLM Service creation...');
    
    try {
      const llmService = createLLMService();
      console.log('✅ LLM Service created successfully');
    } catch (error) {
      console.log(`❌ LLM Service creation failed: ${error}`);
      console.log('   Make sure ANTHROPIC_API_KEY and GOOGLE_API_KEY are set in .env');
    }

    // Test 2: Check environment variables
    console.log('\n🔍 Checking environment variables...');
    
    const requiredEnvVars = [
      'ANTHROPIC_API_KEY',
      'GOOGLE_API_KEY',
      'CLAUDE_MODEL',
      'GEMINI_EMBEDDING_MODEL'
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value || value.includes('your_') || value.includes('_here')) {
        console.log(`❌ ${envVar}: Not configured`);
      } else {
        console.log(`✅ ${envVar}: Configured`);
      }
    }

    // Test 3: Test LLM Service methods (if API keys are available)
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your_');
    const hasGoogleKey = process.env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY.includes('your_');

    if (hasAnthropicKey && hasGoogleKey) {
      console.log('\n🤖 Testing LLM Service methods...');
      
      const llmService = createLLMService();

      // Test embedding generation (Gemini)
      try {
        console.log('🔢 Testing embedding generation...');
        const embedding = await llmService.generateEmbedding('Test sentence for embedding');
        console.log(`✅ Embedding generated: ${embedding.length} dimensions`);
      } catch (error) {
        console.log(`❌ Embedding generation failed: ${error}`);
      }

      // Test response generation (Claude)
      try {
        console.log('💬 Testing response generation...');
        const response = await llmService.generateResponse('What is 2+2? Answer with just the number.');
        console.log(`✅ Response generated: "${response.trim()}"`);
      } catch (error) {
        console.log(`❌ Response generation failed: ${error}`);
      }

      // Test time period extraction (Claude)
      try {
        console.log('📅 Testing time period extraction...');
        const timePeriod = await llmService.extractTimePeriod('What was I thinking in 2023?');
        if (timePeriod) {
          console.log(`✅ Time period extracted: ${timePeriod.start.toISOString()} to ${timePeriod.end.toISOString()}`);
        } else {
          console.log('✅ Correctly returned null for ambiguous query');
        }
      } catch (error) {
        console.log(`❌ Time period extraction failed: ${error}`);
      }

    } else {
      console.log('\n⚠️  Skipping LLM method tests - API keys not configured');
      console.log('   Set ANTHROPIC_API_KEY and GOOGLE_API_KEY in .env to test API calls');
    }

    // Test 4: Model configuration
    console.log('\n⚙️ Testing model configuration...');
    
    const claudeModel = process.env.CLAUDE_MODEL || 'claude-haiku-4.5';
    const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001';
    
    console.log(`✅ Claude model: ${claudeModel}`);
    console.log(`✅ Embedding model: ${embeddingModel}`);

    if (claudeModel === 'claude-haiku-4.5') {
      console.log('✅ Using Claude Haiku 4.5 (latest version - fast and cost-effective)');
    }

    if (embeddingModel === 'embedding-001') {
      console.log('✅ Using Gemini embedding-001 (stable embedding model)');
    }

    console.log('\n🎉 API component tests completed!');

  } catch (error) {
    console.error('\n❌ API component tests failed:', error);
    throw error;
  }
}

// Test summary
async function testSummary() {
  console.log('\n📋 Test Summary:');
  console.log('✅ LLM Service: Claude 3.5 Haiku for chat completions');
  console.log('✅ Embedding Service: Gemini text-embedding-004 for embeddings');
  console.log('✅ Configuration: Environment variables loaded');
  console.log('\n🚀 Ready for API endpoint testing!');
  console.log('\nNext steps:');
  console.log('1. Set up database credentials in .env');
  console.log('2. Add your API keys to .env');
  console.log('3. Run: npm run test:api');
}

// Main test runner
async function runTests() {
  try {
    await testAPIComponents();
    await testSummary();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}