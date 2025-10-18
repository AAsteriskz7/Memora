// Simple LLM service test
// Run this with: npx tsx src/services/llm-test.ts

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { LLMService } from './llm.service'

async function testLLMService() {
  try {
    console.log('🧪 Testing LLM Service...')
    
    // Create service instance
    const llmService = new LLMService({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
      googleApiKey: process.env.GOOGLE_API_KEY || 'test-key',
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
      embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001'
    })
    
    console.log('✅ LLM Service instance created successfully')
    
    // Test 1: Input validation
    console.log('\n📝 Testing input validation...')
    
    try {
      await llmService.generateEmbedding('')
      console.log('❌ Should have thrown error for empty text')
    } catch {
      console.log('✅ Correctly rejected empty text for embedding')
    }
    
    try {
      await llmService.generateResponse('')
      console.log('❌ Should have thrown error for empty prompt')
    } catch {
      console.log('✅ Correctly rejected empty prompt for response')
    }
    
    try {
      await llmService.extractTimePeriod('')
      console.log('❌ Should have thrown error for empty query')
    } catch {
      console.log('✅ Correctly rejected empty query for time period extraction')
    }
    
    // Test 2: Check if API keys are configured
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here'
    const hasGoogleKey = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_api_key_here'
    
    if (!hasAnthropicKey || !hasGoogleKey) {
      console.log('\n⚠️  API keys not configured - skipping API tests')
      console.log('   Set ANTHROPIC_API_KEY and GOOGLE_API_KEY in .env to test actual API calls')
      return
    }
    
    // Test 3: Generate embedding (if API key is available)
    console.log('\n🔢 Testing embedding generation (Gemini)...')
    try {
      const embedding = await llmService.generateEmbedding('This is a test sentence for embedding.')
      console.log(`✅ Generated embedding with ${embedding.length} dimensions`)
      console.log(`   First few values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`)
    } catch (error) {
      console.log(`❌ Embedding generation failed: ${error}`)
    }
    
    // Test 4: Generate response (if API key is available)
    console.log('\n💬 Testing response generation (Claude)...')
    try {
      const response = await llmService.generateResponse('What is the capital of France? Answer in one word.')
      console.log(`✅ Generated response: "${response.trim()}"`)
    } catch (error) {
      console.log(`❌ Response generation failed: ${error}`)
    }
    
    // Test 5: Extract time period (if API key is available)
    console.log('\n📅 Testing time period extraction (Claude)...')
    try {
      const timePeriod1 = await llmService.extractTimePeriod('What was I thinking in 2022?')
      if (timePeriod1) {
        console.log(`✅ Extracted time period: ${timePeriod1.start.toISOString()} to ${timePeriod1.end.toISOString()}`)
      } else {
        console.log('❌ Failed to extract time period from "What was I thinking in 2022?"')
      }
      
      const timePeriod2 = await llmService.extractTimePeriod('What would past me say?')
      if (timePeriod2 === null) {
        console.log('✅ Correctly returned null for query without time period')
      } else {
        console.log('❌ Should have returned null for query without time period')
      }
    } catch (error) {
      console.log(`❌ Time period extraction failed: ${error}`)
    }
    
    console.log('\n🎉 LLM Service tests completed!')
    
  } catch (error) {
    console.error('❌ LLM Service test failed:', error)
  }
}

if (require.main === module) {
  testLLMService()
}