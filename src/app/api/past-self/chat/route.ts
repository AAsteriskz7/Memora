import { NextRequest, NextResponse } from 'next/server';
import { createLLMService } from '@/services/llm.service';
import { createEmbeddingService } from '@/services/embedding.service';
import { prisma } from '@/lib/prisma';
import { TimePeriod, ErrorResponse } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
}

interface ChatRequest {
  message: string;
  timePeriod: {
    start: string;
    end: string;
  };
  personaPrompt: string;
  conversationHistory?: ChatMessage[];
}

interface ChatResponse {
  response: string;
  conversationHistory: ChatMessage[];
  metadata: {
    timePeriod: TimePeriod;
    relevantEntries: number;
    responseGenerated: string;
  };
}

/**
 * POST /api/past-self/chat
 * Have a conversation with your past self using a pre-generated persona.
 * 
 * @description Conducts a conversation with the user's past self by using semantic search
 * to find relevant journal entries from the time period and generating responses using
 * the provided persona prompt. Maintains conversation context for natural dialogue.
 * 
 * @param {ChatRequest} body - Request body containing message and context
 * @param {string} body.message - User's message to their past self
 * @param {object} body.timePeriod - Time period for context filtering
 * @param {string} body.personaPrompt - Pre-generated persona description
 * @param {ChatMessage[]} [body.conversationHistory] - Previous conversation messages
 * 
 * @returns {Promise<NextResponse<ChatResponse>>} 200 - Past-self response and updated history
 * @returns {Promise<NextResponse<ErrorResponse>>} 400 - Invalid request parameters
 * @returns {Promise<NextResponse<ErrorResponse>>} 503 - AI service unavailable
 * @returns {Promise<NextResponse<ErrorResponse>>} 500 - Internal server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (!body.timePeriod?.start || !body.timePeriod?.end) {
      return NextResponse.json(
        { error: 'timePeriod with start and end dates is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    if (!body.personaPrompt?.trim()) {
      return NextResponse.json(
        { error: 'personaPrompt is required. Generate one using /api/past-self/persona first.' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Parse and validate dates
    let startDate: Date;
    let endDate: Date;
    
    try {
      startDate = new Date(body.timePeriod.start);
      endDate = new Date(body.timePeriod.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid date format: ${error instanceof Error ? error.message : 'Unknown error'}` } as ErrorResponse,
        { status: 400 }
      );
    }

    // Initialize services
    const llmService = createLLMService();
    const embeddingService = createEmbeddingService(llmService, prisma);

    // Generate embedding for the user's message
    const messageEmbedding = await embeddingService.generateEmbedding(body.message);

    // Find relevant entries from the time period using semantic search
    const timePeriod: TimePeriod = { start: startDate, end: endDate };
    const relevantEntries = await embeddingService.findSimilarEntries(
      messageEmbedding,
      5, // Limit to 5 most relevant entries
      timePeriod
    );

    // Build conversation context
    const conversationHistory = body.conversationHistory || [];
    
    // Format conversation history for the prompt
    const conversationContext = conversationHistory.length > 0
      ? conversationHistory
          .slice(-6) // Keep last 6 messages to prevent token overflow
          .map(msg => `${msg.role === 'user' ? 'You (current self)' : 'Me (past self)'}: "${msg.message}"`)
          .join('\n')
      : '';

    // Format relevant journal entries
    const entriesContext = relevantEntries.length > 0
      ? relevantEntries
          .map((entry, index) => `Journal Entry ${index + 1} (${entry.date.toLocaleDateString()}):\n"${entry.excerpt}"`)
          .join('\n\n')
      : 'No directly relevant journal entries found for this topic.';

    // Build the complete prompt for the past-self response
    const chatPrompt = `${body.personaPrompt}

CURRENT CONVERSATION CONTEXT:
${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}
Current message from your future self: "${body.message}"

RELEVANT JOURNAL ENTRIES FROM YOUR TIME PERIOD:
${entriesContext}

CRITICAL FORMATTING RULE: Your response must be ONLY spoken words. Do NOT include any text in brackets like [laughs], [looks up], [sighs], [startled], etc. Write as if you're texting or talking - just the words you would actually say.

🚨 CRITICAL TEMPORAL CONSTRAINT: You are from ${new Date(body.timePeriod.end).getFullYear()}. The current date for you is ${new Date(body.timePeriod.end).toLocaleDateString()}. You have ABSOLUTELY NO KNOWLEDGE of any events that happened after this date. If asked about future events, respond authentically that you don't know about them yet because they haven't happened in your time.

INSTRUCTIONS:
- Respond as your past self from this specific time period with authentic personality and voice
- CRITICAL: Write ONLY what you would SAY - absolutely NO stage directions, actions, or descriptions in brackets
- Match the energy and length of your future self's message - if they're short and casual, be short and casual
- Use conversation history to remember what you've already discussed - don't repeat explanations
- Be conversational and engaging but keep it natural and appropriately sized
- Use the exact vocabulary, slang, and communication style from your journal entries
- Reference specific details from your life when relevant, but don't over-explain
- STAY IN CHARACTER - you only know what you knew back then, NO FUTURE KNOWLEDGE WHATSOEVER
- If asked about events after ${new Date(body.timePeriod.end).toLocaleDateString()}, say you don't know about that yet because it hasn't happened
- If they ask about something you just explained, give a brief reminder or say "like I just said..."
- Express emotions naturally through your words, not through action descriptions
- Keep responses 1-3 sentences unless they ask for more detail
- Be authentic to your personality from that specific time period

Your response (pure dialogue, no actions, match their energy, ABSOLUTELY NO FUTURE KNOWLEDGE):`;

    // Generate response using Claude
    const response = await llmService.generateResponse(chatPrompt);

    // Update conversation history
    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', message: body.message },
      { role: 'assistant', message: response.trim() }
    ];

    const chatResponse: ChatResponse = {
      response: response.trim(),
      conversationHistory: updatedHistory,
      metadata: {
        timePeriod,
        relevantEntries: relevantEntries.length,
        responseGenerated: new Date().toISOString()
      }
    };

    return NextResponse.json(chatResponse, { status: 200 });

  } catch (error) {
    console.error('Error in past-self chat:', error);

    // Handle known service errors
    if (error instanceof Error) {
      // Check for database connection errors
      if (error.message.includes('database') || 
          error.message.includes('connection') ||
          error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again later.' } as ErrorResponse,
          { status: 503 }
        );
      }

      // Check for AI service errors
      if (error.message.includes('API') || 
          error.message.includes('LLM') ||
          error.message.includes('Claude') ||
          error.message.includes('Anthropic') ||
          error.message.includes('embedding')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' } as ErrorResponse,
          { status: 503 }
        );
      }
    }

    // Generic server error for unexpected issues
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' } as ErrorResponse,
      { status: 500 }
    );
  }
}