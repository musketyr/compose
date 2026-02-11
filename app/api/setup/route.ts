import { sql, isDatabaseConfigured } from '@/lib/db';
import { generateApiToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/setup
 * Bootstrap a user and generate an API token.
 * Only works when no users exist (first-time setup).
 * 
 * Request body: { email: string, name?: string }
 * Response: { success: true, token: "scribe_...", userId: "uuid" }
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ 
      error: 'Database not configured' 
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id as string;
    } else {
      // Create new user
      const newUser = await sql`
        INSERT INTO users (email, name)
        VALUES (${email}, ${name || email.split('@')[0]})
        RETURNING id
      `;
      userId = newUser.rows[0].id as string;
    }

    // Generate new API token
    const token = await generateApiToken(userId, 'Default Token');

    return NextResponse.json({
      success: true,
      token,
      userId,
      message: 'Save this token - it will not be shown again!'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Setup failed' 
    }, { status: 500 });
  }
}

/**
 * GET /api/setup
 * Check setup status
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ 
      configured: false,
      error: 'Database not configured' 
    });
  }

  try {
    const result = await sql`SELECT COUNT(*) as count FROM users`;
    const userCount = parseInt(result.rows[0].count as string, 10);

    return NextResponse.json({
      configured: true,
      hasUsers: userCount > 0,
      userCount
    });
  } catch {
    return NextResponse.json({ 
      configured: false,
      error: 'Database tables not initialized. Call /api/init first.'
    });
  }
}
