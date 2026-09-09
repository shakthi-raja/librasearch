# Seed data

`pnpm db:seed` loads development data. Every step is an upsert keyed on a natural key (slug, ISBN, edition and chapter number), so running it twice changes nothing.

## Curated catalogue

`catalogue-data.ts` lists real textbooks a campus library holds, grouped under a category tree for six departments.

- Every ISBN-13 is a real edition, checked against its check digit and a public bibliographic record. The database rejects any ISBN whose check digit is wrong.
- Popular titles carry two editions linked through `previous_edition_id`, so the catalogue can offer an earlier edition when the latest is out.
- Book descriptions and chapter summaries are written for LibraSearch in our own words. They describe what each chapter teaches in the vocabulary a syllabus would use, because semantic search and auto-mapping run over them.
- Chapter page ranges are estimates: publishers do not list pages per chapter, so the seed spreads an edition's page count evenly over its chapters.
- Each book names a home rack on the stack map; copies are shelved there.
