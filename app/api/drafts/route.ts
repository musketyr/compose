import { sql } from '@/lib/db';
import { extractBearerToken, validateApiToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/drafts:
 *   get:
 *     summary: List all drafts for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of drafts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Draft'
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  const userId = token ? await validateApiToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT id, title, content, created_at, updated_at
      FROM drafts
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/drafts:
 *   post:
 *     summary: Create a new draft
 *     security:
 *       - bearerAuth: []
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
 *       201:
 *         description: Draft created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Draft'
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  const userId = token ? await validateApiToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title = 'Untitled', content = {} } = body;

    const result = await sql`
      INSERT INTO drafts (user_id, title, content)
      VALUES (${userId}, ${title}, ${JSON.stringify(content)})
      RETURNING id, title, content, created_at, updated_at
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
