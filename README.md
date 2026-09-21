# rose-web-admin

Control plane for **Rose**. Configure **rose-bot** here (sources, pause/unpause). Later: opinions / Jev. There is no rose-service.

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
| `/sources` | Add / edit / pause sources |
| `/articles` | Body preview |
| `GET /health` | Railway probe |

Auth tables (`user`, `session`, `account`, `verification`) are created on first boot if missing. Existing scrape tables are never recreated.

Public site: [rose-web-public](https://github.com/ejqs/rose-web-public). Bot: [newsey](https://github.com/ejqs/newsey).
