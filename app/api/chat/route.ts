import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';
import { sql } from '@/lib/db';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://10.0.1.1:18789';

/**
 * POST /api/chat - Send a message to OpenClaw and get a response
 * 
 * Body: { message: string, draftId?: string }
 * 
 * If draftId is provided, includes document context in the message.
 */
export async function POST(request: NextRequest) {
  // Validate token
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  }

  const userId = await validateApiToken(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, draftId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // If draftId provided, get document context
    let context = '';
    if (draftId) {
      const result = await sql`
        SELECT title, content FROM drafts 
        WHERE id = ${draftId} AND user_id = ${userId}
      `;
      if (result.rows.length > 0) {
        const draft = result.rows[0];
        const contentText = extractText(draft.content);
        context = `\n\n[Document: "${draft.title}"]\n${contentText}\n\n[End of document]\n\n`;
      }
    }

    // Build the prompt for OpenClaw
    const fullMessage = context 
      ? `I'm working on a document. Here's the context:${context}User question: ${message}`
      : message;

    // Call OpenClaw API
    const response = await fetch(`${OPENCLAW_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: fullMessage,
        // Could add session management here
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenClaw error:', error);
      return NextResponse.json({ error: 'Chat service unavailable' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Extract plain text from TipTap JSON content
 */
function extractText(content: any): string {
  if (!content || !content.content) return '';
  
  const texts: string[] = [];
  
  function traverse(node: any) {
    if (node.type === 'text' && node.text) {
      texts.push(node.text);
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  }
  
  content.content.forEach(traverse);
  return texts.join(' ');
}
