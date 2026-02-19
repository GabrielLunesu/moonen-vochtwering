import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return NextResponse.json({ error: 'Tekst is te kort om te verfijnen' }, { status: 400 });
    }

    const { text: refined } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: `Je bent een professionele vochtbestrijder die al 15 jaar actief is in Zuid-Limburg.
Herschrijf de volgende inspectietekst zodat deze professioneler en duidelijker klinkt.
Behoud alle feiten en technische details. Gebruik vakjargon waar gepast.
Schrijf in het Nederlands. Geef alleen de herschreven tekst terug, geen uitleg.`,
      prompt: text.trim(),
      maxTokens: 500,
    });

    return NextResponse.json({ refined: refined.trim() });
  } catch (err) {
    console.error('[AI_REFINE_FAIL]', err);
    return NextResponse.json(
      { error: 'Tekst verfijnen mislukt. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
