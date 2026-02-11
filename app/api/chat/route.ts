import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'https://jean-bot.tailf99986.ts.net';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

/**
 * POST /api/chat
 * Proxy chat requests to OpenClaw gateway
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_TOKEN && { 'Authorization': `Bearer ${OPENCLAW_TOKEN}` }),
      },
      body: JSON.stringify({
        model: body.model || 'default',
        messages: body.messages || [],
        stream: body.stream ?? true,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenClaw error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // If streaming, pass through the stream
    if (body.stream !== false && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Chat proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat proxy error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * Health check for chat endpoint
 */
export async function GET() {
  try {
    const response = await fetch(OPENCLAW_URL, { method: 'HEAD' });
    return NextResponse.json({ 
      status: response.ok ? 'connected' : 'disconnected',
      url: OPENCLAW_URL.replace(/\/\/.*@/, '//***@') // Redact credentials
    });
  } catch {
    return NextResponse.json({ status: 'disconnected' });
  }
}
