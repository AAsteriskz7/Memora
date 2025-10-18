// API Integration Tests
// Run this with: npx tsx src/tests/api-integration.test.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '@/lib/prisma';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test utilities
interface TestResult {
  passed: number;
  failed: number;
  total: number;
  errors: string[];
}

const testResults: TestResult = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

function logTest(name: string, passed: boolean, error?: string) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (error) {
      console.log(`   Error: ${error}`);
      testResults.errors.push(`${name}: ${error}`);
    }
  }
}

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

// Test data cleanup
const createdEntryIds: string[] = [];

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  for (const id of createdEntryIds) {
    try {
      await prisma.entry.delete({ where: { id } });
    } catch (error) {
      // Entry might already be deleted
    }
  }
  console.log(`✅ Cleaned up ${createdEntryIds.length} test entries`);
}

// Test suites
async function testPostEntries() {
  console.log('\n📝 Testing POST /api/entries');
  console.log('='.repeat(50));

  // Test 1: Create entry with valid content
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a test journal entry created at ' + new Date().toISOString()
      }),
    });

    const data = await response.json();
    const passed = response.status === 201 && data.id && data.content;
    
    if (passed && data.id) {
      createdEntryIds.push(data.id);
    }
    
    logTest('Create entry with valid content', passed);
  } catch (error) {
    logTest('Create entry with valid content', false, String(error));
  }

  // Test 2: Create entry with custom createdAt
  try {
    const customDate = new Date('2023-01-15T10:30:00Z');
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Entry with custom date',
        createdAt: customDate.toISOString()
      }),
    });

    const data = await response.json();
    const passed = response.status === 201 && 
                   new Date(data.createdAt).getTime() === customDate.getTime();
    
    if (data.id) {
      createdEntryIds.push(data.id);
    }
    
    logTest('Create entry with custom createdAt', passed);
  } catch (error) {
    logTest('Create entry with custom createdAt', false, String(error));
  }

  // Test 3: Reject empty content
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    });

    const passed = response.status === 400;
    logTest('Reject empty content', passed);
  } catch (error) {
    logTest('Reject empty content', false, String(error));
  }

  // Test 4: Reject content over 10,000 characters
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ content: 'a'.repeat(10001) }),
    });

    const passed = response.status === 400;
    logTest('Reject content over 10,000 characters', passed);
  } catch (error) {
    logTest('Reject content over 10,000 characters', false, String(error));
  }

  // Test 5: Reject missing content field
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const passed = response.status === 400;
    logTest('Reject missing content field', passed);
  } catch (error) {
    logTest('Reject missing content field', false, String(error));
  }

  // Test 6: Reject invalid createdAt
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Test entry',
        createdAt: 'invalid-date'
      }),
    });

    const passed = response.status === 400;
    logTest('Reject invalid createdAt', passed);
  } catch (error) {
    logTest('Reject invalid createdAt', false, String(error));
  }

  // Test 7: Reject future createdAt
  try {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Test entry',
        createdAt: futureDate.toISOString()
      }),
    });

    const passed = response.status === 400;
    logTest('Reject future createdAt', passed);
  } catch (error) {
    logTest('Reject future createdAt', false, String(error));
  }

  // Test 8: Reject invalid JSON
  try {
    const response = await fetch(`${BASE_URL}/api/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const passed = response.status === 400;
    logTest('Reject invalid JSON', passed);
  } catch (error) {
    logTest('Reject invalid JSON', false, String(error));
  }
}

async function testGetEntries() {
  console.log('\n📖 Testing GET /api/entries');
  console.log('='.repeat(50));

  // Test 1: Get entries with default pagination
  try {
    const response = await apiRequest('/api/entries');
    const data = await response.json();
    
    const passed = response.status === 200 &&
                   Array.isArray(data.entries) &&
                   data.pagination &&
                   data.pagination.page === 1 &&
                   data.pagination.limit === 20;
    
    logTest('Get entries with default pagination', passed);
  } catch (error) {
    logTest('Get entries with default pagination', false, String(error));
  }

  // Test 2: Get entries with custom pagination
  try {
    const response = await apiRequest('/api/entries?page=1&limit=5');
    const data = await response.json();
    
    const passed = response.status === 200 &&
                   data.pagination.page === 1 &&
                   data.pagination.limit === 5 &&
                   data.entries.length <= 5;
    
    logTest('Get entries with custom pagination', passed);
  } catch (error) {
    logTest('Get entries with custom pagination', false, String(error));
  }

  // Test 3: Get entries with date filtering
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const response = await apiRequest(
      `/api/entries?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    const data = await response.json();
    
    const passed = response.status === 200 && Array.isArray(data.entries);
    logTest('Get entries with date filtering', passed);
  } catch (error) {
    logTest('Get entries with date filtering', false, String(error));
  }

  // Test 4: Reject invalid page parameter
  try {
    const response = await apiRequest('/api/entries?page=0');
    const passed = response.status === 400;
    logTest('Reject invalid page parameter (page=0)', passed);
  } catch (error) {
    logTest('Reject invalid page parameter (page=0)', false, String(error));
  }

  // Test 5: Reject invalid limit parameter
  try {
    const response = await apiRequest('/api/entries?limit=101');
    const passed = response.status === 400;
    logTest('Reject invalid limit parameter (limit>100)', passed);
  } catch (error) {
    logTest('Reject invalid limit parameter (limit>100)', false, String(error));
  }

  // Test 6: Reject invalid startDate
  try {
    const response = await apiRequest('/api/entries?startDate=invalid-date');
    const passed = response.status === 400;
    logTest('Reject invalid startDate', passed);
  } catch (error) {
    logTest('Reject invalid startDate', false, String(error));
  }

  // Test 7: Reject startDate after endDate
  try {
    const startDate = new Date('2024-12-31');
    const endDate = new Date('2024-01-01');
    
    const response = await apiRequest(
      `/api/entries?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    const passed = response.status === 400;
    logTest('Reject startDate after endDate', passed);
  } catch (error) {
    logTest('Reject startDate after endDate', false, String(error));
  }
}

async function testGetEntryById() {
  console.log('\n🔍 Testing GET /api/entries/[id]');
  console.log('='.repeat(50));

  // Create a test entry first
  let testEntryId: string | null = null;
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test entry for GET by ID' }),
    });
    const data = await response.json();
    testEntryId = data.id;
    if (testEntryId) {
      createdEntryIds.push(testEntryId);
    }
  } catch (error) {
    console.log('⚠️  Failed to create test entry for GET by ID tests');
  }

  // Test 1: Get entry by valid ID
  if (testEntryId) {
    try {
      const response = await apiRequest(`/api/entries/${testEntryId}`);
      const data = await response.json();
      
      const passed = response.status === 200 &&
                     data.id === testEntryId &&
                     data.content === 'Test entry for GET by ID';
      
      logTest('Get entry by valid ID', passed);
    } catch (error) {
      logTest('Get entry by valid ID', false, String(error));
    }
  }

  // Test 2: Return 404 for non-existent ID
  try {
    const response = await apiRequest('/api/entries/00000000-0000-0000-0000-000000000000');
    const passed = response.status === 404;
    logTest('Return 404 for non-existent ID', passed);
  } catch (error) {
    logTest('Return 404 for non-existent ID', false, String(error));
  }

  // Test 3: Reject empty ID
  try {
    const response = await apiRequest('/api/entries/ ');
    // This might return 404 or 400 depending on routing
    const passed = response.status === 404 || response.status === 400;
    logTest('Handle empty ID', passed);
  } catch (error) {
    logTest('Handle empty ID', false, String(error));
  }
}

async function testPutEntry() {
  console.log('\n✏️  Testing PUT /api/entries/[id]');
  console.log('='.repeat(50));

  // Create a test entry first
  let testEntryId: string | null = null;
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ content: 'Original content for PUT test' }),
    });
    const data = await response.json();
    testEntryId = data.id;
    if (testEntryId) {
      createdEntryIds.push(testEntryId);
    }
  } catch (error) {
    console.log('⚠️  Failed to create test entry for PUT tests');
  }

  // Test 1: Update entry with valid content
  if (testEntryId) {
    try {
      const response = await apiRequest(`/api/entries/${testEntryId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: 'Updated content' }),
      });
      const data = await response.json();
      
      const passed = response.status === 200 &&
                     data.id === testEntryId &&
                     data.content === 'Updated content';
      
      logTest('Update entry with valid content', passed);
    } catch (error) {
      logTest('Update entry with valid content', false, String(error));
    }
  }

  // Test 2: Return 404 for non-existent ID
  try {
    const response = await apiRequest('/api/entries/00000000-0000-0000-0000-000000000000', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated content' }),
    });
    const passed = response.status === 404;
    logTest('Return 404 for non-existent ID', passed);
  } catch (error) {
    logTest('Return 404 for non-existent ID', false, String(error));
  }

  // Test 3: Reject empty content
  if (testEntryId) {
    try {
      const response = await apiRequest(`/api/entries/${testEntryId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: '' }),
      });
      const passed = response.status === 400;
      logTest('Reject empty content', passed);
    } catch (error) {
      logTest('Reject empty content', false, String(error));
    }
  }

  // Test 4: Reject content over 10,000 characters
  if (testEntryId) {
    try {
      const response = await apiRequest(`/api/entries/${testEntryId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: 'a'.repeat(10001) }),
      });
      const passed = response.status === 400;
      logTest('Reject content over 10,000 characters', passed);
    } catch (error) {
      logTest('Reject content over 10,000 characters', false, String(error));
    }
  }

  // Test 5: Reject missing content field
  if (testEntryId) {
    try {
      const response = await apiRequest(`/api/entries/${testEntryId}`, {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      const passed = response.status === 400;
      logTest('Reject missing content field', passed);
    } catch (error) {
      logTest('Reject missing content field', false, String(error));
    }
  }
}

async function testDeleteEntry() {
  console.log('\n🗑️  Testing DELETE /api/entries/[id]');
  console.log('='.repeat(50));

  // Create a test entry first
  let testEntryId: string | null = null;
  try {
    const response = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ content: 'Entry to be deleted' }),
    });
    const data = await response.json();
    testEntryId = data.id;
    // Don't add to cleanup list since we're testing deletion
  } catch (error) {
    console.log('⚠️  Failed to create test entry for DELETE tests');
  }

  // Test 1: Delete entry with valid ID
  if (testEntryId) {
    try {
      const response = await apiRequest(`/api/entries/${testEntryId}`, {
        method: 'DELETE',
      });
      const passed = response.status === 204;
      logTest('Delete entry with valid ID', passed);
    } catch (error) {
      logTest('Delete entry with valid ID', false, String(error));
    }

    // Test 2: Verify entry was deleted
    try {
      const response = await apiRequest(`/api/entries/${testEntryId}`);
      const passed = response.status === 404;
      logTest('Verify entry was deleted', passed);
    } catch (error) {
      logTest('Verify entry was deleted', false, String(error));
    }
  }

  // Test 3: Return 404 for non-existent ID
  try {
    const response = await apiRequest('/api/entries/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    const passed = response.status === 404;
    logTest('Return 404 for non-existent ID', passed);
  } catch (error) {
    logTest('Return 404 for non-existent ID', false, String(error));
  }
}

async function testPastSelfQuery() {
  console.log('\n🤖 Testing POST /api/past-self/query');
  console.log('='.repeat(50));
  console.log('⚠️  Note: This endpoint needs to be implemented first (Task 16)');

  // Create some test entries with varied content
  const testEntries = [
    { content: 'I started my new job today. Feeling excited and nervous!', createdAt: '2023-01-15T10:00:00Z' },
    { content: 'Had a great workout session. Feeling strong and healthy.', createdAt: '2023-06-20T14:30:00Z' },
    { content: 'Reflecting on my career goals. Want to become a senior developer.', createdAt: '2023-12-10T20:00:00Z' },
  ];

  for (const entry of testEntries) {
    try {
      const response = await apiRequest('/api/entries', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      const data = await response.json();
      if (data.id) {
        createdEntryIds.push(data.id);
      }
    } catch (error) {
      console.log('⚠️  Failed to create test entry for past-self tests');
    }
  }

  // Test 1: Query with specific time period
  try {
    const response = await apiRequest('/api/past-self/query', {
      method: 'POST',
      body: JSON.stringify({
        query: 'What was I thinking about my career in 2023?',
        timePeriod: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-12-31T23:59:59Z'
        }
      }),
    });

    if (response.status === 404) {
      logTest('Query with specific time period', false, 'Endpoint not implemented yet');
    } else {
      const data = await response.json();
      const passed = response.status === 200 &&
                     data.response &&
                     Array.isArray(data.references) &&
                     data.metadata;
      logTest('Query with specific time period', passed);
    }
  } catch (error) {
    logTest('Query with specific time period', false, String(error));
  }

  // Test 2: Query without time period
  try {
    const response = await apiRequest('/api/past-self/query', {
      method: 'POST',
      body: JSON.stringify({
        query: 'What was I thinking about my health?'
      }),
    });

    if (response.status === 404) {
      logTest('Query without time period', false, 'Endpoint not implemented yet');
    } else {
      const data = await response.json();
      const passed = response.status === 200 &&
                     data.response &&
                     Array.isArray(data.references);
      logTest('Query without time period', passed);
    }
  } catch (error) {
    logTest('Query without time period', false, String(error));
  }

  // Test 3: Reject empty query
  try {
    const response = await apiRequest('/api/past-self/query', {
      method: 'POST',
      body: JSON.stringify({ query: '' }),
    });

    if (response.status === 404) {
      logTest('Reject empty query', false, 'Endpoint not implemented yet');
    } else {
      const passed = response.status === 400;
      logTest('Reject empty query', passed);
    }
  } catch (error) {
    logTest('Reject empty query', false, String(error));
  }

  // Test 4: Handle no entries scenario
  try {
    // This would require clearing the database, so we'll skip for now
    logTest('Handle no entries scenario', false, 'Skipped - requires empty database');
  } catch (error) {
    logTest('Handle no entries scenario', false, String(error));
  }

  // Test 5: Handle no relevant entries for time period
  try {
    const response = await apiRequest('/api/past-self/query', {
      method: 'POST',
      body: JSON.stringify({
        query: 'What was I thinking?',
        timePeriod: {
          start: '2020-01-01T00:00:00Z',
          end: '2020-12-31T23:59:59Z'
        }
      }),
    });

    if (response.status === 404) {
      logTest('Handle no relevant entries for time period', false, 'Endpoint not implemented yet');
    } else {
      const data = await response.json();
      const passed = response.status === 200;
      logTest('Handle no relevant entries for time period', passed);
    }
  } catch (error) {
    logTest('Handle no relevant entries for time period', false, String(error));
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Integration Tests');
  console.log('='.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timeout: ${TEST_TIMEOUT}ms`);
  
  // Check if server is running
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok && response.status !== 404) {
      console.log('\n⚠️  Warning: Server might not be running');
      console.log('   Start the server with: npm run dev');
    }
  } catch (error) {
    console.log('\n❌ Error: Cannot connect to server');
    console.log('   Make sure the server is running: npm run dev');
    console.log('   Also ensure the database is set up:');
    console.log('   1. Configure DATABASE_URL in .env');
    console.log('   2. Run: npm run db:generate');
    console.log('   3. Run: npm run db:migrate');
    process.exit(1);
  }

  // Check database connection by trying to create a test entry
  console.log('\n🔌 Checking database connection...');
  try {
    const testResponse = await apiRequest('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ content: 'Database connection test' }),
    });
    
    if (testResponse.status === 500) {
      const errorData = await testResponse.json();
      if (errorData.error && errorData.error.includes('database')) {
        console.log('❌ Database connection failed');
        console.log('   Make sure:');
        console.log('   1. DATABASE_URL is configured in .env');
        console.log('   2. Database migrations are run: npm run db:migrate');
        console.log('   3. Database server is accessible');
        process.exit(1);
      }
    } else if (testResponse.status === 201) {
      const data = await testResponse.json();
      createdEntryIds.push(data.id);
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.log('⚠️  Could not verify database connection');
  }

  try {
    // Run all test suites
    await testPostEntries();
    await testGetEntries();
    await testGetEntryById();
    await testPutEntry();
    await testDeleteEntry();
    await testPastSelfQuery();

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Cleanup
    await cleanup();

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test runner failed:', error);
    await cleanup();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
