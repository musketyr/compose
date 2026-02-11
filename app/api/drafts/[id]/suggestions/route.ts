import { sql } from '@/lib/db';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

interface Suggestion {
  id: string;
  original: string;
  suggested: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

/**
 * GET /api/drafts/[id]/suggestions
 * List all suggestions for a draft
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractBearerToken(request);
  const userId = token ? await validateApiToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    const result = await sql`
      SELECT suggestions
      FROM drafts
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0].suggestions || []);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/drafts/[id]/suggestions
 * Add a new suggestion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractBearerToken(request);
  const userId = token ? await validateApiToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { original, suggested, reason } = body;

    if (!original || !suggested) {
      return NextResponse.json(
        { error: 'original and suggested are required' },
        { status: 400 }
      );
    }

    const newSuggestion: Suggestion = {
      id: randomUUID(),
      original,
      suggested,
      reason,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Get current suggestions and append
    const result = await sql`
      UPDATE drafts
      SET suggestions = COALESCE(suggestions, '[]'::jsonb) || ${JSON.stringify([newSuggestion])}::jsonb,
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING suggestions
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(newSuggestion, { status: 201 });
  } catch (error) {
    console.error('Error adding suggestion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/drafts/[id]/suggestions
 * Clear all suggestions (or pass ?status=pending to clear only pending)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractBearerToken(request);
  const userId = token ? await validateApiToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    if (statusFilter) {
      // Remove only suggestions with specific status
      await sql`
        UPDATE drafts
        SET suggestions = (
          SELECT COALESCE(jsonb_agg(s), '[]'::jsonb)
          FROM jsonb_array_elements(COALESCE(suggestions, '[]'::jsonb)) s
          WHERE s->>'status' != ${statusFilter}
        ),
        updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
      `;
    } else {
      // Clear all suggestions
      await sql`
        UPDATE drafts
        SET suggestions = '[]'::jsonb, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
      `;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error clearing suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
