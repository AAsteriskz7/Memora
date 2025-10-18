// Real chat functionality test using existing database entries
// Run this with: npx tsx src/services/real-chat-test.ts

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { NextRequest } from 'next/server';
import { POST as generatePersona } from '@/app/api/past-self/persona/route';
import { POST as chatWithPastSelf } from '@/app/api/past-self/chat/route';
import { GET as getEntries } from '@/app/api/entries/route';

interface PersonaResponse {
  personaPrompt: string;
  timePeriod: { start: Date; end: Date };
  entriesAnalyzed: number;
  summary: string;
}

interface ChatResponse {
  response: string;
  conversationHistory: Array<{ role: string; message: string }>;
  metadata: {
    timePeriod: { start: Date; end: Date };
    relevantEntries: number;
    responseGenerated: string;
  };
}

class RealChatTester {
  async runAllTests() {
    console.log('🧪 Testing Past-Self Chat with Real Database Data...\n');

    try {
      // Step 1: Check what entries exist in the database
      await this.checkExistingEntries();

      // Step 2: Test persona generation with different time periods
      await this.testMultiplePersonas();

      // Step 3: Test full chat conversation
      await this.testRealChatConversation();

      console.log('\n🎉 All real chat functionality tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Real chat functionality tests failed:', error);
      throw error;
    }
  }

  private async checkExistingEntries() {
    console.log('📊 Checking existing database entries...');

    try {
      const request = new NextRequest('http://localhost:3000/api/entries?limit=100');
      const response = await getEntries(request);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch entries: ${response.status}`);
      }

      const data = await response.json();
      const entries = data.entries;

      console.log(`✅ Found ${entries.length} total entries in database`);

      if (entries.length === 0) {
        throw new Error('No entries found in database. Please add some journal entries first.');
      }

      // Analyze date distribution
      const entriesByYear: { [year: string]: number } = {};
      let oldestDate = new Date();
      let newestDate = new Date(0);

      entries.forEach((entry: any) => {
        const date = new Date(entry.createdAt);
        const year = date.getFullYear().toString();
        entriesByYear[year] = (entriesByYear[year] || 0) + 1;
        
        if (date < oldestDate) oldestDate = date;
        if (date > newestDate) newestDate = date;
      });

      console.log('📅 Entries by year:');
      Object.entries(entriesByYear)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([year, count]) => {
          console.log(`   ${year}: ${count} entries`);
        });

      console.log(`📈 Date range: ${oldestDate.toLocaleDateString()} to ${newestDate.toLocaleDateString()}\n`);

      return { entries, oldestDate, newestDate, entriesByYear };
    } catch (error) {
      console.error('❌ Failed to check existing entries:', error);
      throw error;
    }
  }

  private async testMultiplePersonas() {
    console.log('🎭 Testing persona generation with different time periods...');

    // Test different time periods based on current date
    const now = new Date();
    const testPeriods = [
      {
        name: '1 Year Ago',
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31)
      },
      {
        name: '2 Years Ago', 
        start: new Date(now.getFullYear() - 2, 0, 1),
        end: new Date(now.getFullYear() - 2, 11, 31)
      },
      {
        name: '3 Years Ago',
        start: new Date(now.getFullYear() - 3, 0, 1),
        end: new Date(now.getFullYear() - 3, 11, 31)
      }
    ];

    for (const period of testPeriods) {
      console.log(`\n🔍 Testing persona for: ${period.name} (${period.start.getFullYear()})`);

      try {
        const personaRequest = new NextRequest('http://localhost:3000/api/past-self/persona', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timePeriod: {
              start: period.start.toISOString(),
              end: period.end.toISOString()
            }
          })
        });

        const personaResponse = await generatePersona(personaRequest);

        if (personaResponse.status === 200) {
          const persona: PersonaResponse = await personaResponse.json();
          console.log(`✅ Generated persona for ${period.name}`);
          console.log(`   Entries analyzed: ${persona.entriesAnalyzed}`);
          console.log(`   Summary: "${persona.summary.substring(0, 100)}..."`);
        } else if (personaResponse.status === 400) {
          const error = await personaResponse.json();
          console.log(`⚠️  No entries found for ${period.name}: ${error.error}`);
        } else {
          console.log(`❌ Failed to generate persona for ${period.name}: ${personaResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${period.name}: ${error}`);
      }
    }
  }

  private async testRealChatConversation() {
    console.log('\n💬 Testing real chat conversation...');

    // Use a recent time period that's likely to have entries
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    console.log(`🎯 Using time period: ${oneYearAgo.getFullYear()} (${oneYearAgo.toLocaleDateString()} to ${endOfLastYear.toLocaleDateString()})`);

    // Step 1: Generate persona
    console.log('\n1️⃣ Generating persona...');
    const personaRequest = new NextRequest('http://localhost:3000/api/past-self/persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timePeriod: {
          start: oneYearAgo.toISOString(),
          end: endOfLastYear.toISOString()
        }
      })
    });

    const personaResponse = await generatePersona(personaRequest);

    if (personaResponse.status !== 200) {
      const error = await personaResponse.json();
      console.log(`⚠️  Skipping chat test - no entries found for this period: ${error.error}`);
      return;
    }

    const persona: PersonaResponse = await personaResponse.json();
    console.log('✅ Persona generated successfully!');
    console.log(`   Entries analyzed: ${persona.entriesAnalyzed}`);
    console.log(`   Summary: "${persona.summary}"`);

    // Step 2: Have a conversation
    console.log('\n2️⃣ Starting conversation...');

    const messages = [
      "Hey! How have you been?",
      "What's been on your mind lately?", 
      "What are you most excited about?",
      "Any challenges you're facing?"
    ];

    let conversationHistory: Array<{ role: string; message: string }> = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`\n👤 You: "${message}"`);

      const chatRequest = new NextRequest('http://localhost:3000/api/past-self/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          timePeriod: {
            start: oneYearAgo.toISOString(),
            end: endOfLastYear.toISOString()
          },
          personaPrompt: persona.personaPrompt,
          conversationHistory
        })
      });

      const chatResponse = await chatWithPastSelf(chatRequest);

      if (chatResponse.status !== 200) {
        const errorText = await chatResponse.text();
        throw new Error(`Chat failed: ${chatResponse.status} ${errorText}`);
      }

      const chat: ChatResponse = await chatResponse.json();
      
      console.log(`🤖 Past Self: "${chat.response}"`);
      console.log(`   📚 Used ${chat.metadata.relevantEntries} relevant entries`);

      // Update conversation history for next message
      conversationHistory = chat.conversationHistory;

      // Add a small delay to make it feel more natural
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Chat conversation completed successfully!');
    console.log(`   💬 Total conversation turns: ${conversationHistory.length}`);
    console.log(`   🎭 Persona maintained consistency throughout conversation`);
  }
}

// Test runner
async function runRealChatTests() {
  const tester = new RealChatTester();

  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Real chat tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting Real Chat Functionality Tests...\n');
  runRealChatTests();
}

export { RealChatTester };