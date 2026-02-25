import { createClient } from '@/lib/supabase/server';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextResponse } from 'next/server';
import { createTools } from '@/lib/quote-builder/tools';
import { buildSystemPrompt } from '@/lib/quote-builder/system-prompt';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawMessages = body.messages;

    if (!rawMessages || !Array.isArray(rawMessages)) {
      return NextResponse.json({ error: 'Messages zijn verplicht' }, { status: 400 });
    }

    const quoteState = body.quoteState || null;
    const systemPrompt = buildSystemPrompt(quoteState);
    const tools = createTools();

    // Ensure every message has a parts array (convertToModelMessages requires it)
    const normalized = rawMessages.map((msg) => {
      if (msg.parts) return msg;
      if (msg.role === 'user' && msg.content) {
        return { ...msg, parts: [{ type: 'text', text: msg.content }] };
      }
      if (msg.role === 'assistant' && msg.content) {
        return { ...msg, parts: [{ type: 'text', text: msg.content }] };
      }
      return { ...msg, parts: [] };
    });

    const messages = await convertToModelMessages(normalized, { tools });

    const result = await streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: systemPrompt,
      messages,
      tools,
      toolChoice: 'auto',
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[API_ERROR] /api/quote-builder/chat:', err);
    return NextResponse.json(
      { error: 'Chat mislukt. Probeer het opnieuw.' },
      { status: 500 }
    );
  }
}
