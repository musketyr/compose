import { sql } from '@/lib/db';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/drafts/{id}:
 *   get:
 *     summary: Get a draft by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Draft details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Draft'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Draft not found
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
      SELECT id, title, content, created_at, updated_at
      FROM drafts
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/drafts/{id}:
 *   put:
 *     summary: Update a draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: object
 *     responses:
 *       200:
 *         description: Draft updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Draft'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Draft not found
 */
export async function PUT(
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
    const { title, content } = body;

    if (title !== undefined && content !== undefined) {
      const result = await sql`
        UPDATE drafts
        SET title = ${title}, content = ${JSON.stringify(content)}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, title, content, created_at, updated_at
      `;
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
      
      return NextResponse.json(result.rows[0]);
    } else if (title !== undefined) {
      const result = await sql`
        UPDATE drafts
        SET title = ${title}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, title, content, created_at, updated_at
      `;
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
      
      return NextResponse.json(result.rows[0]);
    } else if (content !== undefined) {
      const result = await sql`
        UPDATE drafts
        SET content = ${JSON.stringify(content)}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, title, content, created_at, updated_at
      `;
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
      
      return NextResponse.json(result.rows[0]);
    } else {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/drafts/{id}:
 *   delete:
 *     summary: Delete a draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Draft deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Draft not found
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
    
    const result = await sql`
      DELETE FROM drafts
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
