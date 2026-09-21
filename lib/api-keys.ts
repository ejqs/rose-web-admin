import { createHash, randomBytes } from "node:crypto";

/** Matches rose-bot `api-keys.js`: rose_<16-hex-id>_<64-hex-secret>. */
export const DEFAULT_SCOPES = "bot:read bot:command";
export const MAX_ACTIVE_KEYS = 20;
export const API_KEYS_SCHEMA = `
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  secret_hash TEXT NOT NULL UNIQUE,
  scopes TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);
`;

export function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateToken() {
  const id = randomBytes(8).toString("hex");
  const secret = randomBytes(32).toString("hex");
  const token = `rose_${id}_${secret}`;
  return {
    id,
    prefix: `rose_${id}`,
    token,
    secretHash: hashToken(token),
  };
}
