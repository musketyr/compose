import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await validateApiToken(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get chat history for this draft
    const messages = await sql`
      SELECT role, content, created_at as timestamp
      FROM chat_messages
      WHERE draft_id = ${id}
      ORDER BY created_at ASC
      LIMIT 100
    `;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error);
    // If table doesn't exist, just return empty
    return NextResponse.json({ messages: [] });
  }
}
