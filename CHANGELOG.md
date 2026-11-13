# Changelog

Notable changes to LibraSearch, newest first.

## 2026-11-13 - Error pages

- A not-found page for old links and withdrawn copies, an error page with a
  retry, and a last-resort page if the whole app fails to start a page

## 2026-10-09 - Phones, cards and live updates

- Google sign-in for members already on the library's records, with
  linking and unlinking from the account page
- QR labels for every copy, and a page each label opens
- Scanning with the phone camera at the desk, a signed digital library
  card, a self-checkout kiosk and rack stocktakes
- Live alerts when a hold is ready and when a notice is sent
- The demand planner counts prescribed textbooks until chapters are mapped
- The librarian's sections grouped into menus, and an installable app

## 2026-10-07 - Syllabus and search

- The 2026 CSE syllabus: 58 courses with their units and prescribed books,
  and 88 more textbooks with editions checked against Open Library
- Abbreviations such as cn, dbms and daa, and course codes, understood by
  search; librarians curate the abbreviations
- Each reader's own syllabus ranks first, and every result says why it is
  there; whole books are matched beside chapters
- Suggestions while typing, trending searches, and Redis caches for query
  vectors and neighbour lists
- The open shelf of books their authors publish free, and book covers
- An estimate of when the next copy will be back for a book that is all out

## 2026-09-23 - Hardening

- Content security policy with a nonce per request, plus HSTS, frame,
  referrer and permissions headers
- The floor plan on the home page is no longer hidden behind the rack card
- Keyword search ranks chapters with every query word, and the exact phrase,
  first
- Every search is recorded in the search log again

## 2026-09-21 - Operations

- Demand planner, exam lending policies and their automatic expiry
- Procurement requests with near-duplicate checks, approval and receiving
- CSV import with a row-by-row preview and error report
- Analytics dashboard, audit browser and editable library settings
- In-app notices with unread tracking, and a Ctrl/Cmd+K command palette
- Indexes and recorded query plans for the desk reads
- Accessibility pass over the signed-in screens
- One-container web image beside the MySQL, Qdrant and Redis services
- Playwright coverage for discovery, mapping and procurement

## 2026-09-17 - Search

- Semantic search over chapter summaries with Qdrant, filters and a keyword
  fallback when the vector service is down
- Hybrid ranking with reciprocal rank fusion
- Similar books and alternative chapters on the book page
- Faculty syllabus suggestions, review and coverage
- Vector console for drift and rebuilds, plus a 25-query labelled evaluation
- Runbook for the worker, rebuilds and outages

## 2026-09-13 - The desk

- Circulation desk: issue, return, renew and hold pickup with printed slips
- Hold queue placement, cancellation and expiry
- Fines, waiver reasons and the member dashboard
- Loan policies, holidays and busy-period rules in stored procedures
- Role-specific API routes and audit triggers

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
