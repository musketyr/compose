import { Pool, QueryResult, QueryResultRow } from 'pg';

let pgPool: Pool | null = null;

function getPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });
  }
  return pgPool;
}

// Tagged template literal for parameterized queries
export async function sql<T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }
  
  return pool.query<T>(text, values);
}

export const isDatabaseConfigured = () => {
  return !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
};

export async function initDatabase() {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured. Please add POSTGRES_URL environment variable.');
  }

  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Drafts table
  await sql`
    CREATE TABLE IF NOT EXISTS drafts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
      content JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Index for user drafts
  await sql`
    CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id, updated_at DESC)
  `;

  // API tokens table
  await sql`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      token_prefix VARCHAR(12) NOT NULL,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Index for token lookup
  await sql`
    CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash)
  `;

  // Add suggestions column to drafts (safe to run multiple times)
  await sql`
    ALTER TABLE drafts ADD COLUMN IF NOT EXISTS suggestions JSONB DEFAULT '[]'::jsonb
  `;

  // Chat messages table
  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Index for chat history lookup
  await sql`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_draft ON chat_messages(draft_id, created_at)
  `;
}
