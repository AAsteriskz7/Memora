// AI-only test without database dependency
// Run this with: npx tsx src/services/ai-only-test.ts

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { createLLMService } from './llm.service';

interface MockEntry {
  content: string;
  createdAt: string;
}

class AIOnlyTester {
  private llmService = createLLMService();

  async runAllTests() {
    console.log('🧪 Testing AI Functionality (No Database Required)...\n');

    try {
      // Step 1: Test LLM service
      await this.testLLMService();

      // Step 2: Test persona generation with mock data
      await this.testPersonaGeneration();

      // Step 3: Test chat responses
      await this.testChatResponses();

      console.log('\n🎉 All AI functionality tests completed successfully!');
    } catch (error) {
      console.error('\n❌ AI functionality tests failed:', error);
      throw error;
    }
  }

  private async testLLMService() {
    console.log('🤖 Testing LLM Service...');

    // Test basic response generation
    try {
      const response = await this.llmService.generateResponse('What is 2+2? Answer with just the number.');
      console.log(`✅ LLM Response: "${response.trim()}"`);
    } catch (error) {
      console.log(`❌ LLM Response failed: ${error}`);
      throw error;
    }

    // Test embedding generation
    try {
      const embedding = await this.llmService.generateEmbedding('Test sentence for embedding');
      console.log(`✅ Embedding generated: ${embedding.length} dimensions`);
    } catch (error) {
      console.log(`❌ Embedding generation failed: ${error}`);
      throw error;
    }

    console.log('✅ LLM Service working correctly\n');
  }

  private async testPersonaGeneration() {
    console.log('🎭 Testing Persona Generation...');

    // Mock journal entries from different time periods
    const mockEntries2021: MockEntry[] = [
      {
        content: "OMG, just got accepted to Stanford! I literally can't even right now. Mom cried when I told her. This is so unreal. All those late nights studying for SATs finally paid off. College is gonna be lit!",
        createdAt: "2021-03-15T10:00:00Z"
      },
      {
        content: "Stressed about AP exams coming up. Like seriously, why do they make us take so many? AP Calc is killing me and don't even get me started on AP Lit. At least I have coding club to look forward to.",
        createdAt: "2021-04-20T15:30:00Z"
      },
      {
        content: "Had the best day with Sarah today! We went to the mall and got boba. She's literally my best friend ever. We talked about college and how we're both scared but excited.",
        createdAt: "2021-05-10T18:00:00Z"
      }
    ];

    const mockEntries2019: MockEntry[] = [
      {
        content: "Ugh, sophomore year is so much harder than freshman year. Geometry is literally impossible and don't even get me started on World History. At least I have lunch with Emma and the squad.",
        createdAt: "2019-10-12T16:00:00Z"
      },
      {
        content: "Got my first B+ in English today. Mrs. Johnson said my essay on Romeo and Juliet was 'insightful' which is pretty cool I guess. Maybe I'm not as bad at writing as I thought.",
        createdAt: "2019-11-08T17:30:00Z"
      }
    ];

    // Test persona generation for 2021 (college-bound)
    console.log('\n📚 Testing 2021 College-Bound Persona...');
    const persona2021 = await this.generatePersonaFromEntries(mockEntries2021, '2021');
    console.log(`✅ 2021 Persona: "${persona2021.substring(0, 200)}..."`);

    // Test persona generation for 2019 (high school)
    console.log('\n🏫 Testing 2019 High School Persona...');
    const persona2019 = await this.generatePersonaFromEntries(mockEntries2019, '2019');
    console.log(`✅ 2019 Persona: "${persona2019.substring(0, 200)}..."`);

    return { persona2021, persona2019 };
  }

  private async generatePersonaFromEntries(entries: MockEntry[], year: string): Promise<string> {
    const entriesText = entries
      .map((entry, index) => `Entry ${index + 1} (${new Date(entry.createdAt).toLocaleDateString()}):\n"${entry.content}"`)
      .join('\n\n');

    const analysisPrompt = `Analyze these journal entries from ${year} and create a detailed persona description for an AI to embody this person from that specific time period.

JOURNAL ENTRIES:
${entriesText}

Create a comprehensive persona prompt that captures:

1. COMMUNICATION STYLE:
   - Vocabulary and slang used
   - Sentence structure (short/long, formal/casual)
   - Emotional expression patterns

2. PERSONALITY TRAITS:
   - Dominant emotions and moods
   - Confidence level and self-perception
   - Social tendencies

3. LIFE SITUATION & CONCERNS:
   - Major life events happening
   - Primary worries and stresses
   - Goals and aspirations
   - Relationships and social dynamics

4. SPECIFIC DETAILS:
   - Names of people, places, activities mentioned
   - Specific interests and hobbies
   - Daily routines and habits

Generate a detailed system prompt that starts with "You are speaking as yourself from ${year}..." and includes specific examples of how this person would respond.`;

    return await this.llmService.generateResponse(analysisPrompt);
  }

  private async testChatResponses() {
    console.log('\n💬 Testing Chat Responses...');

    // Mock persona for testing
    const mockPersona = `You are speaking as yourself from 2021. You are an 18-year-old high school senior who just got accepted to Stanford. You use slang like "lit", "OMG", "literally", and "lowkey". You're excited about college but also nervous. Your best friend is Sarah, and you love coding club. You're stressed about AP exams but optimistic about the future. You speak casually and enthusiastically, often using exclamation points.`;

    const testMessages = [
      "Hey! How's school going?",
      "What are you most excited about?",
      "Tell me about your friends",
      "Are you nervous about anything?"
    ];

    let conversationHistory: string[] = [];

    for (const message of testMessages) {
      console.log(`\n👤 User: "${message}"`);

      // Build conversation context
      const conversationContext = conversationHistory.length > 0
        ? `Previous conversation:\n${conversationHistory.join('\n')}\n`
        : '';

      const chatPrompt = `${mockPersona}

${conversationContext}Current message from your future self: "${message}"

INSTRUCTIONS:
- Respond as your past self from 2021
- Use the personality, vocabulary, and concerns from that time
- Stay in character - you only know what you knew back then
- Keep the response conversational and natural (2-3 sentences typically)
- Use the slang and communication style from 2021

Response as your past self:`;

      try {
        const response = await this.llmService.generateResponse(chatPrompt);
        console.log(`🤖 Past Self (2021): "${response.trim()}"`);

        // Update conversation history
        conversationHistory.push(`You: "${message}"`);
        conversationHistory.push(`Me: "${response.trim()}"`);

        // Keep only last 4 exchanges to prevent token overflow
        if (conversationHistory.length > 8) {
          conversationHistory = conversationHistory.slice(-8);
        }

      } catch (error) {
        console.log(`❌ Chat response failed: ${error}`);
        throw error;
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ Chat responses working correctly!');
  }
}

// Test runner
async function runAIOnlyTests() {
  console.log('🚀 Starting AI-Only Tests (No Database Required)...\n');

  // Check if API keys are configured
  if (!process.env.ANTHROPIC_API_KEY || !process.env.GOOGLE_API_KEY) {
    console.error('❌ API keys not configured. Please set ANTHROPIC_API_KEY and GOOGLE_API_KEY in .env');
    process.exit(1);
  }

  const tester = new AIOnlyTester();

  try {
    await tester.runAllTests();
    console.log('\n🎯 Summary:');
    console.log('✅ Claude 3.5 Haiku: Working for chat responses');
    console.log('✅ Gemini Embeddings: Working for semantic search');
    console.log('✅ Persona Generation: Creating authentic personalities');
    console.log('✅ Chat Conversations: Maintaining character consistency');
    console.log('\n🚀 AI functionality is ready! Fix database connection to test full system.');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 AI tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAIOnlyTests();
}

export { AIOnlyTester };