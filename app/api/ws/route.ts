import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://10.0.1.1:18789';

export async function GET(request: NextRequest) {
  // Validate token first
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  }

  const userId = await validateApiToken(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade?.toLowerCase() !== 'websocket') {
    return NextResponse.json({ error: 'Expected WebSocket upgrade' }, { status: 426 });
  }

  // For Next.js App Router, WebSocket handling requires middleware or custom server
  // Return info about the validated user for now
  return NextResponse.json({ 
    error: 'WebSocket proxy requires Edge Runtime or custom server',
    userId,
    openclawUrl: OPENCLAW_URL
  }, { status: 501 });
}
