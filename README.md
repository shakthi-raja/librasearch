# LibraSearch

Syllabus-aware discovery and demand-adaptive circulation for a campus library.

Students search by meaning and land on the chapter their syllabus is talking about, with the copy on the shelf and the rack it sits on. Faculty confirm which chapters cover each unit. The desk issues, returns and holds copies under rules the database itself enforces, and lending tightens on its own when an exam is close and copies are short.

## What it does

- Search by meaning and by words, fused, over chapters and whole books. Abbreviations such as cn, dbms or daa and course codes such as UE24CS351A are understood, and a signed-in student's own syllabus ranks first.
- The 2026 CSE syllabus: every course, its units and its prescribed books, with an approved chapter-level reading list per unit.
- A circulation desk, holds, fines and renewals whose rules live in MySQL procedures, triggers and events.
- Phones as scanners: QR labels on every copy, a signed digital library card, a self-checkout kiosk and rack stocktakes.
- Live alerts when a hold is ready, an estimate of when an all-out book will be back, and an open shelf of books their authors publish free.

## Stack

| Layer | Choice |
|---|---|
| Web | Next.js 16 (App Router), React 19, TypeScript 7, Tailwind CSS 4 |
| Source of truth | MySQL 9.7 LTS: constraints, generated columns, triggers, procedures, events, roles and grants |
| Semantic index | Qdrant 1.19, rebuilt from MySQL at any time |
| Shared state | Redis 8.10 for rate limits, search caches, trending searches and live updates, never a source of truth |
| Quality | Biome, strict TypeScript, Vitest, Playwright, lefthook, GitHub Actions |

SQL is written by hand through `mysql2`, with no ORM. Sessions are opaque tokens with Argon2id passwords, with no auth library.

## Getting started

Prerequisites: Node 24 LTS, pnpm 12 and Docker with Compose. MySQL, Qdrant and Redis run in containers.

```bash
cp .env.example .env          # then replace every change-me value
docker compose up -d          # mysql on 3307, qdrant on 6333, redis on 6380
pnpm install
pnpm db:migrate               # schema, grants and application accounts
pnpm db:seed                  # departments and demo accounts
pnpm dev                      # http://localhost:3000
```

MySQL listens on host port 3307 so it can sit beside a local server on 3306.

### One command with the web app in a container

```bash
docker compose up -d --build   # web on 3000, mysql, qdrant and redis beside it
pnpm db:migrate                # from the host, against the same MySQL
```

The image builds the Next.js app in standalone mode and runs it as the `node`
user. The health endpoint at `/api/health` answers 200 only while the database
is reachable, and compose waits for it before calling the service healthy.

### Demo accounts

Seeded for local development only.

| Role | Sign in with | Password |
|---|---|---|
| Librarian | `librarian@librasearch.local` | `Libra@2026` |
| Faculty | `faculty@librasearch.local` | `Libra@2026` |
| Student | `student@librasearch.local` or `PES1UG24CS001` | `Libra@2026` |
| Student | `PES1UG25CS843` Shakthi, `PES2UG23CS277` Kishan | `Libra@2026` |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build`, `pnpm start` | Production build and server |
| `pnpm check` | Biome, route types and `tsc` |
| `pnpm test:unit` | Pure logic, no services needed |
| `pnpm test:db` | Constraints, triggers, routines and grants against a fresh `_test` schema |
| `pnpm db:migrate`, `pnpm db:status` | Apply or list migrations; provisions database accounts |
| `pnpm db:reset` | Drop and rebuild the development schema |
| `pnpm db:seed` | Load development data |

## How it fits together

```
browser -> Next.js (proxy, server actions, /api/v1 route handlers)
             -> services -> repositories -> one mysql2 pool per database account
```

Every page checks the session and role on the server, and every database connection runs as an account that can only do what its role may do. The sign-in path, for example, uses `app_auth`, which can read the columns it needs to verify a password and write sessions, and nothing else.

## Configuration

Every setting is read from `.env` and validated at boot; a missing or placeholder secret stops the process with the variable's name. `.env.example` lists them all. The admin database credential is used by migrations, seed and tests only, never by the running app.

### Google sign-in

Optional. Create an OAuth client of type "Web application" in the Google Cloud
console, add `APP_URL/api/v1/auth/google/callback` as an authorised redirect
URI (for example `https://library.example.org/api/v1/auth/google/callback`
behind a tunnel), and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

- Nobody is created by Google sign-in. The first time, a member is found by
  the verified address Google returns; after that, by Google's account id.
- A member whose Google address differs from the college email signs in with
  the university ID once and links Google from the account page.
- Without the two variables the button is hidden and the routes refuse.

### Phones and the camera

Cameras only work over HTTPS (or on localhost), so phones reach the app through a tunnel or a reverse proxy with a certificate. Set `APP_URL` to that public address before printing labels, because each label's QR encodes `APP_URL/c/<barcode>`; Google sign-in needs the same address as its redirect.

- Labels: Admin, Catalogue, a book, Print copy labels. A4 sheets of 21.
- Library card: students and faculty open Card; the QR renews itself every few minutes. Set `CARD_SECRET` to at least 32 random characters.
- Kiosk: sign a tablet in as a librarian and open `/kiosk`. Members borrow with their card and return books by scanning them.
- Stocktake: Admin, Desk, Stocktake, choose a rack and scan along it.

The app can be installed to a phone's home screen from the browser menu.

## Documentation

- `docs/database/` entity relationship and relational schema diagrams
- `docs/DESIGN.md` the design system
- `docs/RUNBOOK.md` worker, rebuilds, evaluation and outages
- `docs/PERFORMANCE.md` the query plans behind the desk screens
- `docs/ACCESSIBILITY.md` the keyboard and screen-reader pass
- `db/migrations/README.md` migration rules

## Operating the vector index

The worker, rebuild, drift checks and evaluation are described in
[docs/RUNBOOK.md](docs/RUNBOOK.md).
