# Changelog

Notable changes to LibraSearch, newest first.

## 2026-09-05 - Foundation

- Next.js 16 app with strict TypeScript, Biome and commit hooks
- Docker Compose stack for MySQL 9.7, Qdrant 1.19 and Redis 8.10
- Validated environment, forward-only migrations with a checksum ledger
- Access schema: roles with borrowing policy, users, sessions, login attempts
- Sign-in, sign-out and session lookup with Argon2id and opaque tokens
- Least-privilege `app_auth` database account with column grants
- Design system, application shell and the generated stack map
- Unit and database test suites, CI for checks, migrations, audit and secrets
