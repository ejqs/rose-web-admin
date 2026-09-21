# Backend HTTP

**Updated:** 2026-09-21

This app is a utilitarian control plane. It talks to [rose-backend](https://github.com/ejqs/rose-backend) over REST. It does not use Drizzle, `pg`, or better-auth.

| Env | Required |
| --- | --- |
| `ROSE_BACKEND_URL` | yes |

Login: `POST /v1/auth/login` → store `rose_session` cookie on this origin → server actions send `Authorization: Bearer <token>`.

| Admin page | Backend |
| --- | --- |
| `/` | `GET /v1/admin/dashboard` |
| `/sources` | `GET/POST/PATCH /v1/admin/sources` |
| `/articles` | `GET /v1/admin/articles` (body preview) |
| `/keys` | `GET/POST/DELETE /v1/admin/api-keys` (secret shown once) |

Remove `DATABASE_URL` and `BETTER_AUTH_*` from Railway after this deploys. Bootstrap the operator on rose-backend, not here.
