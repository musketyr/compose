import { sql } from '@/lib/db';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/drafts/[id]/suggestions/[suggestionId]
 * Update a suggestion's status (accept/reject)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  const token = extractBearerToken(request);
  const userId = token ? await validateApiToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, suggestionId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['accepted', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "accepted", "rejected", or "pending"' },
        { status: 400 }
      );
    }

    // Update the specific suggestion's status
    const result = await sql`
      UPDATE drafts
      SET suggestions = (
        SELECT jsonb_agg(
          CASE 
            WHEN s->>'id' = ${suggestionId} 
            THEN jsonb_set(s, '{status}', ${JSON.stringify(status)}::jsonb)
            ELSE s
          END
        )
        FROM jsonb_array_elements(COALESCE(suggestions, '[]'::jsonb)) s
      ),
      updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING suggestions
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Find and return the updated suggestion
    const suggestions = result.rows[0].suggestions || [];
    const updated = suggestions.find((s: { id: string }) => s.id === suggestionId);

    if (!updated) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/drafts/[id]/suggestions/[suggestionId]
 * Delete a specific suggestion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  const token = extractBearerToken(request);
  const userId = token ? await validateApiToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, suggestionId } = await params;

    await sql`
      UPDATE drafts
      SET suggestions = (
        SELECT COALESCE(jsonb_agg(s), '[]'::jsonb)
        FROM jsonb_array_elements(COALESCE(suggestions, '[]'::jsonb)) s
        WHERE s->>'id' != ${suggestionId}
      ),
      updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
