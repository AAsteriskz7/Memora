// API Integration Tests
// Run this with: npm run test:api

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Import API route handlers
import {
  POST as createEntry,
  GET as getEntries,
} from "@/app/api/entries/route";
import {
  GET as getEntry,
  PUT as updateEntry,
  DELETE as deleteEntry,
} from "@/app/api/entries/[id]/route";
import { POST as queryPastSelf } from "@/app/api/past-self/query/route";

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds

interface TestEntry {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  entries: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PastSelfResponse {
  response: string;
  references: Array<{
    entryId: string;
    date: string;
    excerpt: string;
    relevanceScore: number;
  }>;
  metadata: {
    entriesSearched: number;
    timePeriod: {
      start: string;
      end: string;
    };
    warning?: string;
  };
}

class APITester {
  private testEntryIds: string[] = [];

  async runAllTests() {
    console.log("🧪 Starting API Integration Tests...\n");

    try {
      // Check prerequisites
      await this.checkPrerequisites();

      // Test all endpoints
      await this.testEntriesEndpoints();
      await this.testPastSelfEndpoint();

      console.log("\n🎉 All API integration tests completed successfully!");
    } catch (error) {
      console.error("\n❌ API integration tests failed:", error);
      throw error;
    } finally {
      // Cleanup test data
      await this.cleanup();
    }
  }

  private async checkPrerequisites() {
    console.log("🔍 Checking prerequisites...");

    // Check database connection
    try {
      await prisma.$connect();
      console.log("✅ Database connection established");
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }

    // Check if API key is configured
    if (
      !process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_API_KEY === "your_google_api_key_here"
    ) {
      console.log("⚠️  GOOGLE_API_KEY not configured - some tests may fail");
    } else {
      console.log("✅ Google API key configured");
    }

    console.log("✅ Prerequisites check completed\n");
  }

  private async testEntriesEndpoints() {
    console.log("📝 Testing Entries API Endpoints...\n");

    await this.testCreateEntry();
    await this.testGetEntries();
    await this.testGetSingleEntry();
    await this.testUpdateEntry();
    await this.testDeleteEntry();
    await this.testEntriesErrorCases();

    console.log("✅ Entries API endpoints tests completed\n");
  }

  private async testCreateEntry() {
    console.log("🔨 Testing POST /api/entries...");

    // Test 1: Create entry with content only
    const request1 = new NextRequest("http://localhost:3000/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Test entry created at " + new Date().toISOString(),
      }),
    });

    const createResponse1 = await createEntry(request1);

    if (createResponse1.status !== 201) {
      const errorText = await createResponse1.text();
      throw new Error(
        `Create entry failed: ${createResponse1.status} ${errorText}`
      );
    }

    const entry1: TestEntry = await createResponse1.json();
    this.testEntryIds.push(entry1.id);

    console.log(`✅ Created entry with ID: ${entry1.id}`);
    console.log(`   Content: "${entry1.content.substring(0, 50)}..."`);

    // Test 2: Create entry with custom date
    const customDate = new Date("2024-01-01T12:00:00Z");
    const request2 = new NextRequest("http://localhost:3000/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Test entry with custom date",
        createdAt: customDate.toISOString(),
      }),
    });

    const createResponse2 = await createEntry(request2);

    if (createResponse2.status !== 201) {
      throw new Error(
        `Create entry with custom date failed: ${createResponse2.status}`
      );
    }

    const entry2: TestEntry = await createResponse2.json();
    this.testEntryIds.push(entry2.id);

    const entryDate = new Date(entry2.createdAt);
    if (Math.abs(entryDate.getTime() - customDate.getTime()) > 1000) {
      throw new Error("Custom date not set correctly");
    }

    console.log("✅ Created entry with custom date");

    // Test 3: Validation errors
    const invalidRequest = new NextRequest(
      "http://localhost:3000/api/entries",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      }
    );

    const invalidResponse = await createEntry(invalidRequest);

    if (invalidResponse.status !== 400) {
      throw new Error("Should have returned 400 for empty content");
    }

    console.log("✅ Correctly rejected empty content");
  }

  private async testGetEntries() {
    console.log("📋 Testing GET /api/entries...");

    // Test 1: Get entries without parameters
    const request1 = new NextRequest("http://localhost:3000/api/entries");
    const getResponse1 = await getEntries(request1);

    if (getResponse1.status !== 200) {
      throw new Error(`Get entries failed: ${getResponse1.status}`);
    }

    const result1: PaginatedResponse<TestEntry> = await getResponse1.json();
    console.log(`✅ Retrieved ${result1.entries.length} entries`);
    console.log(
      `   Total: ${result1.pagination.total}, Pages: ${result1.pagination.totalPages}`
    );

    // Test 2: Get entries with pagination
    const request2 = new NextRequest(
      "http://localhost:3000/api/entries?page=1&limit=5"
    );
    const getResponse2 = await getEntries(request2);

    if (getResponse2.status !== 200) {
      throw new Error(
        `Get entries with pagination failed: ${getResponse2.status}`
      );
    }

    const result2: PaginatedResponse<TestEntry> = await getResponse2.json();
    if (result2.entries.length > 5) {
      throw new Error("Pagination limit not respected");
    }

    console.log(
      `✅ Pagination working correctly (limit: 5, got: ${result2.entries.length})`
    );

    // Test 3: Get entries with date filtering
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const request3 = new NextRequest(
      `http://localhost:3000/api/entries?startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}`
    );
    const getResponse3 = await getEntries(request3);

    if (getResponse3.status !== 200) {
      throw new Error(
        `Get entries with date filter failed: ${getResponse3.status}`
      );
    }

    const result3: PaginatedResponse<TestEntry> = await getResponse3.json();
    console.log(
      `✅ Date filtering working (found ${result3.entries.length} entries from last 24h)`
    );

    // Test 4: Invalid pagination parameters
    const invalidRequest = new NextRequest(
      "http://localhost:3000/api/entries?page=0"
    );
    const invalidResponse = await getEntries(invalidRequest);

    if (invalidResponse.status !== 400) {
      throw new Error("Should have returned 400 for page=0");
    }

    console.log("✅ Correctly rejected invalid pagination parameters");
  }

  private async testGetSingleEntry() {
    console.log("🔍 Testing GET /api/entries/[id]...");

    if (this.testEntryIds.length === 0) {
      throw new Error("No test entries available for single entry test");
    }

    const entryId = this.testEntryIds[0];

    // Test 1: Get existing entry
    const request1 = new NextRequest(
      `http://localhost:3000/api/entries/${entryId}`
    );
    const getResponse = await getEntry(request1, {
      params: Promise.resolve({ id: entryId }),
    });

    if (getResponse.status !== 200) {
      throw new Error(`Get single entry failed: ${getResponse.status}`);
    }

    const entry: TestEntry = await getResponse.json();
    if (entry.id !== entryId) {
      throw new Error("Retrieved entry ID does not match requested ID");
    }

    console.log(`✅ Retrieved single entry: ${entry.id}`);

    // Test 2: Get non-existent entry
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const request2 = new NextRequest(
      `http://localhost:3000/api/entries/${nonExistentId}`
    );
    const notFoundResponse = await getEntry(request2, {
      params: Promise.resolve({ id: nonExistentId }),
    });

    if (notFoundResponse.status !== 404) {
      throw new Error("Should have returned 404 for non-existent entry");
    }

    console.log("✅ Correctly returned 404 for non-existent entry");

    // Test 3: Invalid entry ID format
    const invalidId = "invalid-id";
    const request3 = new NextRequest(
      `http://localhost:3000/api/entries/${invalidId}`
    );
    const invalidResponse = await getEntry(request3, {
      params: Promise.resolve({ id: invalidId }),
    });

    if (invalidResponse.status !== 400) {
      throw new Error("Should have returned 400 for invalid ID format");
    }

    console.log("✅ Correctly rejected invalid ID format");
  }

  private async testUpdateEntry() {
    console.log("✏️ Testing PUT /api/entries/[id]...");

    if (this.testEntryIds.length === 0) {
      throw new Error("No test entries available for update test");
    }

    const entryId = this.testEntryIds[0];
    const updatedContent =
      "Updated test entry content at " + new Date().toISOString();

    // Test 1: Update existing entry
    const request1 = new NextRequest(
      `http://localhost:3000/api/entries/${entryId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updatedContent }),
      }
    );

    const updateResponse = await updateEntry(request1, {
      params: Promise.resolve({ id: entryId }),
    });

    if (updateResponse.status !== 200) {
      const errorText = await updateResponse.text();
      throw new Error(
        `Update entry failed: ${updateResponse.status} ${errorText}`
      );
    }

    const updatedEntry: TestEntry = await updateResponse.json();
    if (updatedEntry.content !== updatedContent) {
      throw new Error("Entry content was not updated correctly");
    }

    console.log(`✅ Updated entry: ${updatedEntry.id}`);
    console.log(
      `   New content: "${updatedEntry.content.substring(0, 50)}..."`
    );

    // Test 2: Update non-existent entry
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const request2 = new NextRequest(
      `http://localhost:3000/api/entries/${nonExistentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "This should fail" }),
      }
    );

    const notFoundResponse = await updateEntry(request2, {
      params: Promise.resolve({ id: nonExistentId }),
    });

    if (notFoundResponse.status !== 404) {
      throw new Error("Should have returned 404 for non-existent entry update");
    }

    console.log("✅ Correctly returned 404 for non-existent entry update");

    // Test 3: Update with empty content
    const request3 = new NextRequest(
      `http://localhost:3000/api/entries/${entryId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      }
    );

    const invalidResponse = await updateEntry(request3, {
      params: Promise.resolve({ id: entryId }),
    });

    if (invalidResponse.status !== 400) {
      throw new Error("Should have returned 400 for empty content update");
    }

    console.log("✅ Correctly rejected empty content update");
  }

  private async testDeleteEntry() {
    console.log("🗑️ Testing DELETE /api/entries/[id]...");

    if (this.testEntryIds.length === 0) {
      throw new Error("No test entries available for delete test");
    }

    const entryId = this.testEntryIds.pop()!; // Remove from tracking since we're deleting it

    // Test 1: Delete existing entry
    const request1 = new NextRequest(
      `http://localhost:3000/api/entries/${entryId}`,
      {
        method: "DELETE",
      }
    );

    const deleteResponse = await deleteEntry(request1, {
      params: Promise.resolve({ id: entryId }),
    });

    if (deleteResponse.status !== 204) {
      throw new Error(`Delete entry failed: ${deleteResponse.status}`);
    }

    console.log(`✅ Deleted entry: ${entryId}`);

    // Test 2: Verify entry is deleted
    const request2 = new NextRequest(
      `http://localhost:3000/api/entries/${entryId}`
    );
    const getResponse = await getEntry(request2, {
      params: Promise.resolve({ id: entryId }),
    });

    if (getResponse.status !== 404) {
      throw new Error("Entry should not exist after deletion");
    }

    console.log("✅ Confirmed entry was deleted");

    // Test 3: Delete non-existent entry
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const request3 = new NextRequest(
      `http://localhost:3000/api/entries/${nonExistentId}`,
      {
        method: "DELETE",
      }
    );

    const notFoundResponse = await deleteEntry(request3, {
      params: Promise.resolve({ id: nonExistentId }),
    });

    if (notFoundResponse.status !== 404) {
      throw new Error(
        "Should have returned 404 for non-existent entry deletion"
      );
    }

    console.log("✅ Correctly returned 404 for non-existent entry deletion");
  }

  private async testEntriesErrorCases() {
    console.log("⚠️ Testing entries error cases...");

    // Test 1: Invalid JSON
    const request1 = new NextRequest("http://localhost:3000/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    });

    const invalidJsonResponse = await createEntry(request1);

    if (invalidJsonResponse.status !== 400) {
      throw new Error("Should have returned 400 for invalid JSON");
    }

    console.log("✅ Correctly handled invalid JSON");

    // Test 2: Missing content-type header
    const request2 = new NextRequest("http://localhost:3000/api/entries", {
      method: "POST",
      body: JSON.stringify({ content: "test" }),
    });

    const noHeaderResponse = await createEntry(request2);

    if (noHeaderResponse.status !== 400) {
      throw new Error("Should have returned 400 for missing content-type");
    }

    console.log("✅ Correctly handled missing content-type header");

    // Test 3: Content too long
    const longContent = "a".repeat(10001);
    const request3 = new NextRequest("http://localhost:3000/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: longContent }),
    });

    const longContentResponse = await createEntry(request3);

    if (longContentResponse.status !== 400) {
      throw new Error("Should have returned 400 for content too long");
    }

    console.log("✅ Correctly rejected content over 10,000 characters");
  }

  private async testPastSelfEndpoint() {
    console.log("🤖 Testing Past-Self API Endpoint...\n");

    // Ensure we have some test entries for past-self queries
    if (this.testEntryIds.length === 0) {
      await this.createTestEntriesForPastSelf();
    }

    await this.testPastSelfQuery();
    await this.testPastSelfWithTimePeriod();
    await this.testPastSelfErrorCases();

    console.log("✅ Past-Self API endpoint tests completed\n");
  }

  private async createTestEntriesForPastSelf() {
    console.log("📝 Creating test entries for past-self queries...");

    const testEntries = [
      {
        content:
          "Today I started learning React. It seems challenging but exciting. I hope I can build something cool with it.",
        createdAt: new Date("2023-06-01T10:00:00Z").toISOString(),
      },
      {
        content:
          "Had a great day at work today. Finally solved that bug that was bothering me for weeks. Feeling accomplished!",
        createdAt: new Date("2023-08-15T15:30:00Z").toISOString(),
      },
      {
        content:
          "Thinking about my career goals. I want to become a senior developer within the next two years. Need to focus on learning more about system design.",
        createdAt: new Date("2024-01-10T09:00:00Z").toISOString(),
      },
    ];

    for (const entry of testEntries) {
      const request = new NextRequest("http://localhost:3000/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      const response = await createEntry(request);

      if (response.status === 201) {
        const created: TestEntry = await response.json();
        this.testEntryIds.push(created.id);
      }
    }

    console.log(
      `✅ Created ${testEntries.length} test entries for past-self queries`
    );
  }

  private async testPastSelfQuery() {
    console.log("💭 Testing POST /api/past-self/query...");

    // Skip if no API key
    if (
      !process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_API_KEY === "your_google_api_key_here"
    ) {
      console.log(
        "⚠️  Skipping past-self query tests - GOOGLE_API_KEY not configured"
      );
      return;
    }

    // Test 1: Basic query without time period
    const request1 = new NextRequest(
      "http://localhost:3000/api/past-self/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "What were you thinking about your career?",
        }),
      }
    );

    const queryResponse1 = await queryPastSelf(request1);

    if (queryResponse1.status !== 200) {
      const errorText = await queryResponse1.text();
      throw new Error(
        `Past-self query failed: ${queryResponse1.status} ${errorText}`
      );
    }

    const result1: PastSelfResponse = await queryResponse1.json();
    console.log(`✅ Basic query successful`);
    console.log(`   Response: "${result1.response.substring(0, 100)}..."`);
    console.log(`   References: ${result1.references.length}`);
    console.log(`   Entries searched: ${result1.metadata.entriesSearched}`);

    if (result1.references.length === 0) {
      console.log("⚠️  No references returned - this might indicate an issue");
    }

    // Test 2: Query with general time reference
    const request2 = new NextRequest(
      "http://localhost:3000/api/past-self/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "How did you feel about learning new technologies in 2023?",
        }),
      }
    );

    const queryResponse2 = await queryPastSelf(request2);

    if (queryResponse2.status === 200) {
      const result2: PastSelfResponse = await queryResponse2.json();
      console.log(`✅ Time-referenced query successful`);
      console.log(
        `   Time period: ${result2.metadata.timePeriod.start} to ${result2.metadata.timePeriod.end}`
      );
    } else {
      console.log(`⚠️  Time-referenced query failed: ${queryResponse2.status}`);
    }
  }

  private async testPastSelfWithTimePeriod() {
    console.log("📅 Testing past-self query with explicit time period...");

    // Skip if no API key
    if (
      !process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_API_KEY === "your_google_api_key_here"
    ) {
      console.log(
        "⚠️  Skipping time period tests - GOOGLE_API_KEY not configured"
      );
      return;
    }

    // Test with explicit time period
    const request = new NextRequest(
      "http://localhost:3000/api/past-self/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "What were you working on?",
          timePeriod: {
            start: "2023-01-01",
            end: "2023-12-31",
          },
        }),
      }
    );

    const queryResponse = await queryPastSelf(request);

    if (queryResponse.status === 200) {
      const result: PastSelfResponse = await queryResponse.json();
      console.log(`✅ Explicit time period query successful`);
      console.log(
        `   Time period: ${result.metadata.timePeriod.start} to ${result.metadata.timePeriod.end}`
      );

      // Verify time period was respected
      const startDate = new Date(result.metadata.timePeriod.start);
      const endDate = new Date(result.metadata.timePeriod.end);

      if (startDate.getFullYear() !== 2023 || endDate.getFullYear() !== 2023) {
        console.log("⚠️  Time period might not have been respected correctly");
      }
    } else {
      console.log(
        `⚠️  Explicit time period query failed: ${queryResponse.status}`
      );
    }
  }

  private async testPastSelfErrorCases() {
    console.log("⚠️ Testing past-self error cases...");

    // Test 1: Empty query
    const request1 = new NextRequest(
      "http://localhost:3000/api/past-self/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "" }),
      }
    );

    const emptyQueryResponse = await queryPastSelf(request1);

    if (emptyQueryResponse.status !== 400) {
      throw new Error("Should have returned 400 for empty query");
    }

    console.log("✅ Correctly rejected empty query");

    // Test 2: Invalid JSON
    const request2 = new NextRequest(
      "http://localhost:3000/api/past-self/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      }
    );

    const invalidJsonResponse = await queryPastSelf(request2);

    if (invalidJsonResponse.status !== 400) {
      throw new Error("Should have returned 400 for invalid JSON");
    }

    console.log("✅ Correctly handled invalid JSON");

    // Test 3: Missing query field
    const request3 = new NextRequest(
      "http://localhost:3000/api/past-self/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    const missingQueryResponse = await queryPastSelf(request3);

    if (missingQueryResponse.status !== 400) {
      throw new Error("Should have returned 400 for missing query field");
    }

    console.log("✅ Correctly rejected missing query field");

    // Test 4: Invalid time period format
    const request4 = new NextRequest(
      "http://localhost:3000/api/past-self/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "test query",
          timePeriod: {
            start: "invalid-date",
            end: "2024-01-01",
          },
        }),
      }
    );

    const invalidTimeResponse = await queryPastSelf(request4);

    if (invalidTimeResponse.status !== 400) {
      throw new Error(
        "Should have returned 400 for invalid time period format"
      );
    }

    console.log("✅ Correctly rejected invalid time period format");
  }

  private async cleanup() {
    console.log("\n🧹 Cleaning up test data...");

    try {
      // Delete all test entries
      for (const entryId of this.testEntryIds) {
        const request = new NextRequest(
          `http://localhost:3000/api/entries/${entryId}`,
          {
            method: "DELETE",
          }
        );
        await deleteEntry(request, {
          params: Promise.resolve({ id: entryId }),
        });
      }

      console.log(`✅ Cleaned up ${this.testEntryIds.length} test entries`);
    } catch (error) {
      console.log(`⚠️  Cleanup failed: ${error}`);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Main test runner
async function runAPITests() {
  const tester = new APITester();

  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Test suite failed:", error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Set timeout for the entire test suite
  const timeout = setTimeout(() => {
    console.error("\n⏰ Test suite timed out after 30 seconds");
    process.exit(1);
  }, TEST_TIMEOUT);

  runAPITests().finally(() => {
    clearTimeout(timeout);
  });
}

export { APITester };
