// Simple Past-Self API endpoint test
// Run this with: npx tsx src/app/api/past-self/query/test.ts

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import { NextRequest } from 'next/server';
import { POST } from './route';

async function testPastSelfAPI() {
  try {
    console.log('🧪 Testing Past-Self API endpoint...');
    
    // Test 1: Input validation - missing query
    console.log('\n📝 Testing input validation...');
    
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'Query is required') {
        console.log('✅ Correctly rejected missing query');
      } else {
        console.log('❌ Should have rejected missing query');
      }
    } catch (error) {
      console.log(`❌ Error testing missing query: ${error}`);
    }
    
    // Test 2: Input validation - empty query
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ query: '' }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'Query cannot be empty') {
        console.log('✅ Correctly rejected empty query');
      } else {
        console.log(`❌ Should have rejected empty query. Got: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Error testing empty query: ${error}`);
    }
    
    // Test 2b: Input validation - whitespace-only query
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ query: '   ' }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'Query cannot be empty') {
        console.log('✅ Correctly rejected whitespace-only query');
      } else {
        console.log(`❌ Should have rejected whitespace-only query. Got: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Error testing whitespace query: ${error}`);
    }
    
    // Test 3: Input validation - query too long
    try {
      const longQuery = 'a'.repeat(1001);
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ query: longQuery }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'Query cannot exceed 1,000 characters') {
        console.log('✅ Correctly rejected query too long');
      } else {
        console.log('❌ Should have rejected query too long');
      }
    } catch (error) {
      console.log(`❌ Error testing long query: ${error}`);
    }
    
    // Test 4: Input validation - invalid preset
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'What was I thinking?',
          preset: 'invalid-preset'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error.includes('Invalid preset')) {
        console.log('✅ Correctly rejected invalid preset');
      } else {
        console.log('❌ Should have rejected invalid preset');
      }
    } catch (error) {
      console.log(`❌ Error testing invalid preset: ${error}`);
    }
    
    // Test 5: Input validation - both timePeriod and preset
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'What was I thinking?',
          preset: '1-year-ago',
          timePeriod: {
            start: '2023-01-01',
            end: '2023-12-31'
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'Cannot specify both timePeriod and preset. Choose one.') {
        console.log('✅ Correctly rejected both timePeriod and preset');
      } else {
        console.log('❌ Should have rejected both timePeriod and preset');
      }
    } catch (error) {
      console.log(`❌ Error testing both timePeriod and preset: ${error}`);
    }
    
    // Test 6: Input validation - invalid date format
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'What was I thinking?',
          timePeriod: {
            start: 'invalid-date',
            end: '2023-12-31'
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error.includes('valid ISO 8601 date string')) {
        console.log('✅ Correctly rejected invalid date format');
      } else {
        console.log('❌ Should have rejected invalid date format');
      }
    } catch (error) {
      console.log(`❌ Error testing invalid date: ${error}`);
    }
    
    // Test 7: Input validation - start date after end date
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'What was I thinking?',
          timePeriod: {
            start: '2023-12-31',
            end: '2023-01-01'
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'timePeriod.start must be before timePeriod.end') {
        console.log('✅ Correctly rejected start date after end date');
      } else {
        console.log('❌ Should have rejected start date after end date');
      }
    } catch (error) {
      console.log(`❌ Error testing date range: ${error}`);
    }
    
    // Test 8: Check if API key is configured
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
      console.log('\n⚠️  GOOGLE_API_KEY not configured - skipping API tests');
      console.log('   Set GOOGLE_API_KEY in .env to test actual API calls');
      return;
    }
    
    // Test 9: Valid query with no entries (should return specific error)
    console.log('\n🤖 Testing valid query scenarios...');
    
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'What was I thinking about my career?'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.code === 'NO_ENTRIES') {
        console.log('✅ Correctly handled no entries scenario');
      } else if (response.status === 200) {
        console.log('✅ Successfully processed query with existing entries');
        console.log(`   Response: "${data.response.substring(0, 100)}..."`);
        console.log(`   References: ${data.references.length}`);
        console.log(`   Entries searched: ${data.metadata.entriesSearched}`);
        if (data.metadata.warning) {
          console.log(`   Warning: ${data.metadata.warning}`);
        }
      } else {
        console.log(`❌ Unexpected response: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Error testing valid query: ${error}`);
    }
    
    // Test 10: Valid query with preset
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'How was I feeling?',
          preset: '1-year-ago'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.code === 'NO_ENTRIES') {
        console.log('✅ Correctly handled no entries scenario with preset');
      } else if (response.status === 200) {
        console.log('✅ Successfully processed query with preset');
        console.log(`   Preset used: 1-year-ago`);
        console.log(`   Response: "${data.response.substring(0, 100)}..."`);
      } else {
        console.log(`❌ Unexpected response with preset: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Error testing query with preset: ${error}`);
    }
    
    // Test 11: Valid query with explicit time period
    try {
      const request = new NextRequest('http://localhost:3000/api/past-self/query', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'What was I working on?',
          timePeriod: {
            start: '2023-01-01',
            end: '2023-12-31'
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      if (response.status === 400 && data.code === 'NO_ENTRIES') {
        console.log('✅ Correctly handled no entries scenario with time period');
      } else if (response.status === 200) {
        console.log('✅ Successfully processed query with time period');
        console.log(`   Time period: 2023-01-01 to 2023-12-31`);
        console.log(`   Response: "${data.response.substring(0, 100)}..."`);
      } else {
        console.log(`❌ Unexpected response with time period: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Error testing query with time period: ${error}`);
    }
    
    console.log('\n🎉 Past-Self API endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Past-Self API test failed:', error);
  }
}

if (require.main === module) {
  testPastSelfAPI();
}