# Changelog

Notable changes to LibraSearch, newest first.

## 2026-09-09 - Catalogue and access

- Public catalogue with the subject tree, facet filters, sorting and honest paging
- Keyword search over chapters, books and authors with highlighted snippets
- Book pages with editions, tables of contents, live copies and rack pins
- Librarian catalogue editor for books, editions and copies
- Curated 45-book catalogue, 51 editions and 214 chapter summaries, plus the
  deterministic generator for people, courses and copies
- Argon2id sign-in, opaque sessions, password change, lockout and throttling
- One database account per role, with grant boundaries covered by the db suite
- Playwright coverage for sign-in, role boundaries and guest browsing

## 2026-09-05 - Foundation

- Next.js 16 app with strict TypeScript, Biome and commit hooks
- Docker Compose stack for MySQL 9.7, Qdrant 1.19 and Redis 8.10
- Validated environment, forward-only migrations with a checksum ledger
- Access schema: roles with borrowing policy, users, sessions, login attempts
- Sign-in, sign-out and session lookup with Argon2id and opaque tokens
- Least-privilege `app_auth` database account with column grants
- Design system, application shell and the generated stack map
- Unit and database test suites, CI for checks, migrations, audit and secrets
