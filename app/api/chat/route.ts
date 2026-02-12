import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';
import { sql } from '@/lib/db';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://10.0.1.1:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

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

    // Build conversation history
    const conversationMessages: Array<{ role: string; content: string }> = [];
    
    // Add system message with document context
    const systemMessage = context 
      ? `You are Jean, a helpful writing assistant. The user is working on a document and may ask questions or request edits. Be concise and helpful.\n\nDocument context:${context}`
      : `You are Jean, a helpful writing assistant. Be concise and helpful.`;
    
    conversationMessages.push({ role: 'system', content: systemMessage });
    
    // Fetch previous messages from this chat session (last 20 messages)
    if (draftId) {
      try {
        const history = await sql`
          SELECT role, content FROM chat_messages
          WHERE draft_id = ${draftId}
          ORDER BY created_at ASC
          LIMIT 20
        `;
        for (const msg of history.rows) {
          conversationMessages.push({ 
            role: msg.role as string, 
            content: msg.content as string 
          });
        }
      } catch {
        // Table might not exist yet, continue without history
      }
    }
    
    // Add current user message
    conversationMessages.push({ role: 'user', content: message });

    // Call OpenClaw chat completions endpoint
    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5-20250929',
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenClaw error:', response.status, error);
      return NextResponse.json({ error: 'Chat service unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'No response';
    
    // Save messages to history if draftId is provided
    if (draftId) {
      try {
        await sql`
          INSERT INTO chat_messages (draft_id, role, content, created_at)
          VALUES 
            (${draftId}, 'user', ${message}, NOW()),
            (${draftId}, 'assistant', ${assistantMessage}, NOW())
        `;
      } catch (e) {
        // Table might not exist yet, ignore
        console.error('Failed to save chat history:', e);
      }
    }
    
    return NextResponse.json({ 
      response: assistantMessage,
    });

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
