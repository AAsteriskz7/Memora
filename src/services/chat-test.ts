// Chat functionality test
// Run this with: npx tsx src/services/chat-test.ts

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { NextRequest } from "next/server";
import { POST as createEntry } from "@/app/api/entries/route";
import { POST as generatePersona } from "@/app/api/past-self/persona/route";
import { POST as chatWithPastSelf } from "@/app/api/past-self/chat/route";

interface TestEntry {
  content: string;
  createdAt: string;
}

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

class ChatTester {
  private testEntryIds: string[] = [];

  async runAllTests() {
    console.log("🧪 Testing Past-Self Chat Functionality...\n");

    try {
      // Step 1: Create test journal entries
      await this.createTestEntries();

      // Step 2: Test persona generation
      const persona = await this.testPersonaGeneration();

      // Step 3: Test chat functionality
      await this.testChatConversation(persona);

      console.log("\n🎉 All chat functionality tests completed successfully!");
    } catch (error) {
      console.error("\n❌ Chat functionality tests failed:", error);
      throw error;
    } finally {
      // Cleanup test data
      await this.cleanup();
    }
  }

  private async createTestEntries() {
    console.log("📝 Creating test journal entries...");

    const testEntries: TestEntry[] = [
      // 2021 entries (3 years ago) - College student persona
      {
        content:
          "OMG, just got accepted to Stanford! I literally can't even right now. Mom cried when I told her. This is so unreal. All those late nights studying for SATs finally paid off. Sarah said we should celebrate but I have calc homework lol. College is gonna be lit!",
        createdAt: "2021-03-15T10:00:00Z",
      },
      {
        content:
          "Stressed about AP exams coming up. Like seriously, why do they make us take so many? AP Calc is killing me and don't even get me started on AP Lit. At least I have coding club to look forward to. We're building this sick web app for the school. Technology is the future fr.",
        createdAt: "2021-04-20T15:30:00Z",
      },
      {
        content:
          "Had the best day with Sarah today! We went to the mall and got boba. She's literally my best friend ever. We talked about college and how we're both scared but excited. She's going to UCLA and I'm going to Stanford. We promised to stay in touch. High school is almost over, crazy!",
        createdAt: "2021-05-10T18:00:00Z",
      },
      {
        content:
          "Graduation was today. I can't believe high school is over. It feels so weird. Everyone was crying and taking pictures. Dad gave this whole speech about being proud of me. I'm excited for Stanford but also lowkey terrified. What if I'm not smart enough? What if I don't make friends?",
        createdAt: "2021-06-15T20:00:00Z",
      },
      {
        content:
          "First week at Stanford is done. It's been intense but amazing. My roommate Jake is super cool, he's from Texas and loves basketball. The CS classes are no joke though. Professor Chen expects us to already know Python but I'm still learning. Gotta step up my game. The campus is beautiful tho.",
        createdAt: "2021-09-05T22:00:00Z",
      },

      // 2019 entries (5 years ago) - High school sophomore persona
      {
        content:
          "Ugh, sophomore year is so much harder than freshman year. Geometry is literally impossible and don't even get me started on World History. At least I have lunch with Emma and the squad. We're planning to go to homecoming together. Need to ask mom for money for a dress.",
        createdAt: "2019-10-12T16:00:00Z",
      },
      {
        content:
          "Got my first B+ in English today. Mrs. Johnson said my essay on Romeo and Juliet was 'insightful' which is pretty cool I guess. Maybe I'm not as bad at writing as I thought. Still prefer math though. Numbers make sense, feelings are confusing lol.",
        createdAt: "2019-11-08T17:30:00Z",
      },
      {
        content:
          "Drama with Jessica today. She's been acting weird ever since I started hanging out with Emma more. High school friendships are so complicated. Why can't we all just get along? At least I have cross country to clear my head. Running helps me think.",
        createdAt: "2019-12-03T19:00:00Z",
      },
    ];

    for (const entry of testEntries) {
      try {
        const request = new NextRequest("http://localhost:3000/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });

        const response = await createEntry(request);

        if (response.status === 201) {
          const created = await response.json();
          this.testEntryIds.push(created.id);
          console.log(
            `✅ Created entry: "${entry.content.substring(0, 50)}..."`
          );
        } else {
          console.log(`❌ Failed to create entry: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Error creating entry: ${error}`);
      }
    }

    console.log(`✅ Created ${this.testEntryIds.length} test entries\n`);
  }

  private async testPersonaGeneration(): Promise<PersonaResponse> {
    console.log("🎭 Testing persona generation...");

    // Test persona for 2021 (college student era)
    const personaRequest = new NextRequest(
      "http://localhost:3000/api/past-self/persona",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timePeriod: {
            start: "2021-01-01T00:00:00Z",
            end: "2021-12-31T23:59:59Z",
          },
        }),
      }
    );

    const personaResponse = await generatePersona(personaRequest);

    if (personaResponse.status !== 200) {
      const errorText = await personaResponse.text();
      throw new Error(
        `Persona generation failed: ${personaResponse.status} ${errorText}`
      );
    }

    const persona: PersonaResponse = await personaResponse.json();

    console.log("✅ Persona generated successfully!");
    console.log(`   Entries analyzed: ${persona.entriesAnalyzed}`);
    console.log(
      `   Time period: ${new Date(persona.timePeriod.start).getFullYear()}`
    );
    console.log(`   Summary: "${persona.summary.substring(0, 100)}..."`);
    console.log(
      `   Persona prompt: "${persona.personaPrompt.substring(0, 150)}..."\n`
    );

    return persona;
  }

  private async testChatConversation(persona: PersonaResponse) {
    console.log("💬 Testing chat conversation...");

    const messages = [
      "Hey! How's college going?",
      "What are you most excited about right now?",
      "Are you nervous about anything?",
      "Tell me about your friends",
    ];

    let conversationHistory: Array<{ role: string; message: string }> = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`\n👤 User: "${message}"`);

      const chatRequest = new NextRequest(
        "http://localhost:3000/api/past-self/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            timePeriod: {
              start: "2021-01-01T00:00:00Z",
              end: "2021-12-31T23:59:59Z",
            },
            personaPrompt: persona.personaPrompt,
            conversationHistory,
          }),
        }
      );

      const chatResponse = await chatWithPastSelf(chatRequest);

      if (chatResponse.status !== 200) {
        const errorText = await chatResponse.text();
        throw new Error(`Chat failed: ${chatResponse.status} ${errorText}`);
      }

      const chat: ChatResponse = await chatResponse.json();

      console.log(`🤖 Past Self: "${chat.response}"`);
      console.log(`   Relevant entries: ${chat.metadata.relevantEntries}`);

      // Update conversation history for next message
      conversationHistory = chat.conversationHistory;

      // Add a small delay to make it feel more natural
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n✅ Chat conversation completed successfully!");
    console.log(`   Total conversation turns: ${conversationHistory.length}`);
  }

  private async cleanup() {
    console.log("\n🧹 Cleaning up test data...");

    // Note: In a real implementation, you'd delete the test entries here
    // For now, we'll just log the cleanup
    console.log(`✅ Would clean up ${this.testEntryIds.length} test entries`);
  }
}

// Test runner
async function runChatTests() {
  const tester = new ChatTester();

  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Chat tests failed:", error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log("🚀 Starting Chat Functionality Tests...\n");
  runChatTests();
}

export { ChatTester };
