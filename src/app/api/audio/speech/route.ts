import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    // Call Minimax T2A via OpenRouter Proxy
    const response = await fetch('https://ai.hackclub.com/proxy/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'minimax/speech-02-turbo',
        input: text,
        voice: 'male-en-01' // Example voice
      })
    });

    if (!response.ok) throw new Error('T2A failed');
    
    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
