# Bot API keys

**Updated:** 2026-09-21

Rose admin mints API keys that authenticate **rose-bot** command APIs. Keys are not a UI-only token: the hashed secret lives in shared Postgres (`api_keys`), and rose-bot checks it on `/v1/*`.

## Generate a key

1. Sign in at `/login`.
2. Open **API keys** (`/keys`).
3. Enter a name (default `rose/newsey`) and click **Generate key**.
4. Copy the secret immediately. It is shown once. Only `sha256(secret)` is stored.
5. **Revoke** disables the key. **Rotate** issues a new secret (same name and scopes) and revokes the old one; copy the new secret once.

Prefix (for example `rose_ab12…`) is safe to display. The full secret looks like `rose_<16-hex-id>_<64-hex-secret>`.

Active keys are capped at 20. Default scopes: `bot:read bot:command`.

## Call rose-bot

After this admin change **and** the matching rose-bot change are deployed:

| | |
| --- | --- |
| Base URL (live) | `https://rose-production-ac15.up.railway.app` |
| Auth | `Authorization: Bearer <secret>` or `X-Rose-Key: <secret>` |

| Method | Path | Scope | What |
| --- | --- | --- | --- |
| `GET` | `/v1/status` | `bot:read` | Bot health, last tick, key metadata |
| `GET` | `/v1/sources` | `bot:read` | Source list (ops fields) |
| `POST` | `/v1/tick` | `bot:command` | Run one scrape tick now |
| `POST` | `/v1/sources` | `bot:command` | Create a source (`name`, `base_url`, `feed_url`, optional `scrape_method`, `priority`, `status`) |
| `POST` | `/v1/sources/:id` | `bot:command` | Update a source (any of those fields plus `status`: `ok` / `paused` / `unknown`) |

Example:

```bash
curl -sS https://rose-production-ac15.up.railway.app/v1/status \
  -H "Authorization: Bearer rose_<id>_<secret>"

curl -sS -X POST https://rose-production-ac15.up.railway.app/v1/tick \
  -H "Authorization: Bearer rose_<id>_<secret>" \
  -H "Content-Type: application/json" \
  -d '{}'

curl -sS -X POST https://rose-production-ac15.up.railway.app/v1/sources/1 \
  -H "Authorization: Bearer rose_<id>_<secret>" \
  -H "Content-Type: application/json" \
  -d '{"status":"paused"}'
```

401 = missing/invalid/revoked key. 403 = key lacks the scope. 409 on tick = a tick is already running.

Full command-API detail lives in [newsey `docs/bot-command-api.md`](https://github.com/ejqs/newsey/blob/main/docs/bot-command-api.md) once that PR is merged.

## Config

No new env vars on admin. Keys are rows in Postgres (`DATABASE_URL`), same database as rose-bot.

| Already required | Why |
| --- | --- |
| `DATABASE_URL` | Shared Postgres; `api_keys` is created on admin boot |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | Session login to reach `/keys` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded operator account |

rose-bot does **not** need a new env var to accept these keys. Optional `ROSE_SERVICE_TOKEN` still gates legacy `GET /sources` as a static bearer; hashed admin keys also work there.
