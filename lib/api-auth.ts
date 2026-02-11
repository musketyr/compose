import { sql } from './db';
import { createHash, randomBytes } from 'crypto';

/**
 * Generate a new API token for a user.
 * Returns the raw token (show once to user) and stores the hash.
 */
export async function generateApiToken(userId: string, name: string): Promise<string> {
  const rawToken = `scribe_${randomBytes(24).toString('hex')}`;
  const tokenHash = hashToken(rawToken);
  const tokenPrefix = rawToken.slice(0, 12);

  await sql`
    INSERT INTO api_tokens (user_id, name, token_hash, token_prefix)
    VALUES (${userId}, ${name}, ${tokenHash}, ${tokenPrefix})
  `;

  return rawToken;
}

/**
 * Hash a token for storage/comparison.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Validate an API token and return the user ID if valid.
 */
export async function validateApiToken(token: string): Promise<string | null> {
  if (!token || !token.startsWith('scribe_')) {
    return null;
  }

  const tokenHash = hashToken(token);
  
  const result = await sql`
    SELECT user_id FROM api_tokens
    WHERE token_hash = ${tokenHash}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  // Update last_used_at
  await sql`
    UPDATE api_tokens
    SET last_used_at = NOW()
    WHERE token_hash = ${tokenHash}
  `;

  return result.rows[0].user_id as string;
}

/**
 * List all API tokens for a user (without the actual token values).
 */
export async function listUserTokens(userId: string) {
  const result = await sql`
    SELECT id, name, token_prefix, last_used_at, created_at
    FROM api_tokens
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

/**
 * Delete an API token.
 */
export async function deleteApiToken(userId: string, tokenId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM api_tokens
    WHERE id = ${tokenId} AND user_id = ${userId}
  `;
  return (result.rowCount ?? 0) > 0;
}

/**
 * Extract bearer token from Authorization header.
 */
export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  return auth.slice(7);
}
