# rose-web-admin

Control plane for **Rose**. Configure **rose-bot** here (sources, pause/unpause, Jev questions). There is no rose-service.

Auth is email/password via better-auth. No public signup. First admin is seeded from `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

## Run

Requires **Node 22+** and `DATABASE_URL` (same Railway Postgres as rose-bot).

```bash
cp .env.example .env
# set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run dev
```

| Path | What |
| --- | --- |
| `/login` | Sign in |
| `/` | Bot health + source status |
| `/sources` | Discover feeds (URLs/OPML), catalog add, edit / pause sources |
| `/articles` | Body preview |
| `/keys` | Generate / copy / revoke / rotate bot API keys |
| `/questions` | Add / edit / disable Jev taxonomy questions |
| `GET /health` | Railway probe |

Auth tables (`user`, `session`, `account`, `verification`) and `api_keys` are created on first boot if missing. Existing scrape tables are never recreated. `jev_questions` is `CREATE TABLE IF NOT EXISTS` so the questions form works; rose-bot seeds globe + hop-in + metadata rows.

API keys: [docs/api-keys.md](docs/api-keys.md). Jev questions: [docs/jev-questions.md](docs/jev-questions.md). Sources: [docs/sources.md](docs/sources.md). Index: [docs/README.md](docs/README.md).

Public site: [rose-web-public](https://github.com/ejqs/rose-web-public). Bot: [newsey](https://github.com/ejqs/newsey).
