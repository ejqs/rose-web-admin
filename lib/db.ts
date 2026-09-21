import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const AUTH_SCHEMA = `
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
`;

const globalForDb = globalThis as unknown as {
  rosePool?: Pool;
  roseDb?: ReturnType<typeof drizzle<typeof schema>>;
  roseAuthReady?: Promise<void>;
};

function getPool() {
  if (!globalForDb.rosePool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is required (Postgres).");
    }
    globalForDb.rosePool = new Pool({
      connectionString: url,
      max: 3,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalForDb.rosePool;
}

export function getDb() {
  if (!globalForDb.roseDb) {
    globalForDb.roseDb = drizzle(getPool(), { schema });
  }
  return globalForDb.roseDb;
}

export async function ensureAuthTables() {
  if (!globalForDb.roseAuthReady) {
    globalForDb.roseAuthReady = getPool().query(AUTH_SCHEMA).then(() => undefined);
  }
  await globalForDb.roseAuthReady;
}
