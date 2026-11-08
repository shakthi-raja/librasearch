# Vector search runbook

## The pipeline

A catalogue write commits a row in `embedding_outbox` in the same
transaction as the change. The worker claims rows with
`FOR UPDATE SKIP LOCKED`, builds the chapter, book or unit document,
embeds it with BGE-small and upserts the point in Qdrant. A failed job
retries with exponential backoff (5s, 25s, 125s) and then stays
`FAILED` with its last error. Nothing in the request path embeds.

The three collections are `chapters`, `books` and `syllabus_units`.
Each point id is the MySQL primary key, which is what lets a hit be
joined back to availability without a second index.

## Starting and stopping

The worker is a separate process:

```bash
pnpm worker:dev        # development, polls every WORKER_POLL_MS
pnpm worker:rebuild    # drop and replay every active row
```

Run one worker per environment. Two workers are safe because claiming
is locked, but the embedding model loads per process and the memory
cost is real.

## Checking health

`/admin/vector` shows the Qdrant count per collection beside the MySQL
count the worker should have indexed, the outbox status counts and the
last eight jobs. A non-zero drift with an empty outbox means jobs were
lost; rebuild.

The counts to compare:

| collection | MySQL source |
|---|---|
| `chapters` | every chapter row |
| `books` | books with status `ACTIVE` |
| `syllabus_units` | every syllabus unit |

## Rebuild

Rebuild when the drift is unexplained, after changing the document
text builders, or after restoring a database backup. It drops the
collections and replays them, so search returns fewer results while it
runs. On the seeded catalogue it takes well under a minute; a
production catalogue with tens of thousands of chapters takes longer
and should run off-peak.

The console button and `pnpm worker:rebuild` do the same work.

## Qdrant is unavailable

Search degrades rather than failing. The search page runs the keyword
half, shows a notice that semantic results are unavailable, and returns
200. `GET /api/v1/search` sets `semanticDown: true` and still returns
the keyword hits. If Qdrant stays down, the outbox grows; it drains on
its own once Qdrant returns, so do not clear it by hand.

If the worker has been down for a long time, restart it before
rebuilding; the outbox replay is cheaper than a full rebuild.

## The embedding model

The model is pinned in `EMBEDDING_MODEL` and cached under
`.cache/huggingface` (override with `HF_CACHE_DIR`). The first worker
start downloads it; later starts load from the cache. A model change
requires a rebuild, because vectors from different models do not
compare.

The query side adds the retrieval instruction
`Represent this sentence for searching relevant passages: ` and the
document side does not. Changing that prefix requires a rebuild.

## Evaluation

With the app running:

```bash
pnpm eval:search
```

The labelled set is `db/eval/queries.json`, thirty five queries each
naming the chapters a good result should contain, as `isbn13#chapter` so
the set survives a reseed. It includes abbreviations (cn, daa, rag) and a
course code. The script reports
Recall@10, MRR@10 and the first expected rank per query. It fails if
any request errors. Run it before and after changing ranking weights,
the score floor or the fusion constant; the numbers are only comparable
against the same catalogue.

With every copy on the shelf the seeded catalogue scores Recall@10 0.935 and
MRR@10 0.871. The seed's term of loans takes every copy of the busiest
textbooks out, and ranking gives a fifth of the score to a copy being in, so
some of their chapters drop a place: about 0.913 and 0.843.

The test suite writes vectors under `QDRANT_COLLECTION_PREFIX=test_`; leave it
empty for the app, or a test run would overwrite the development index.

## Query understanding

Before either search runs, the query passes through two steps:

- Aliases: words such as `cn`, `daa` or `ui/ux` become what they stand for.
  Librarians manage them under Admin, Search; the map is cached in Redis for
  ten minutes and dropped whenever a librarian changes it. A query in quotes
  is searched literally.
- Course codes: a query that is exactly a code such as `UE24CS351A` shows
  that course with its prescribed books and searches the course title.

Signed-in students and faculty then get their own syllabus first: chapters
approved for their units rise by a quarter, books prescribed for their
courses by a tenth. Guests and librarians see the plain ranking.

## Redis

Redis holds nothing that cannot be rebuilt, and every key starts with the
database name, so the test schema and development never share entries.

| Key | What it holds | Lifetime |
|---|---|---|
| `search:vector:*` | query vectors as float32 | a week |
| `search:neighbours:<version>:*` | Qdrant neighbour ids and scores | an hour |
| `search:catalogue-version` | bumped by the worker after each batch | permanent |
| `search:trending:<day>` | searches that found something, per day | eight days |
| `search:suggest:v2:<version>:*` | autocomplete per prefix | five minutes |
| `search:aliases:v1` | the alias map | ten minutes |

Availability is never cached: copies and racks always come from MySQL.
After restoring a backup or editing Qdrant by hand, run
`pnpm worker:rebuild`, which bumps the catalogue version and so retires
every cached neighbour list.

## When to page someone

- the outbox has `FAILED` jobs and the count is rising
- drift on any collection with an empty outbox
- the worker has not claimed a job while the outbox is non-empty
- the evaluation drops sharply after a deploy
