# rose-web-admin

Control plane for **Rose**. Configure **rose-bot** here (sources, pause/unpause, API keys). Later: opinions / Jev.

Auth is email/password against [rose-backend](https://github.com/ejqs/rose-backend). No public signup. First admin is seeded on the backend from `ROSE_BOOTSTRAP_ADMIN_EMAIL` + `ROSE_BOOTSTRAP_ADMIN_PASSWORD`.

## Run

Requires **Node 22+** and `ROSE_BACKEND_URL`.

```bash
cp .env.example .env
# set ROSE_BACKEND_URL
npm install
npm run dev
```

| Path | What |
| --- | --- |
| `/login` | Sign in |
| `/` | Bot health + source status |
| `/sources` | Add / edit / pause sources |
| `/articles` | Body preview |
| `/keys` | Mint / revoke command API keys |
| `GET /health` | Railway probe |

Public site: [rose-web-public](https://github.com/ejqs/rose-web-public). Bot: [newsey](https://github.com/ejqs/newsey). API: [rose-backend](https://github.com/ejqs/rose-backend).
