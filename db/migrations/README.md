# Migrations

Forward-only SQL files applied in order by `pnpm db:migrate`.

- Name: `NNNN_lower_snake_name.sql`, four-digit version, no gaps reused.
- An applied file is never edited. The runner stores a SHA-256 of each file in
  `schema_migrations` and refuses to run when an applied file has changed.
- Routines and triggers use `DELIMITER $$` exactly as in the mysql client.
- One module per file. Constraint and index names follow `docs/database` conventions:
  `pk_`, `fk_`, `uq_`, `ck_`, `ix_`, `ft_`, `trg_`, `sp_`, `fn_`, `ev_`, `v_`.

| Command | Effect |
|---|---|
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:status` | List applied and pending migrations |
| `pnpm db:reset` | Drop the development schema and apply everything (refuses in production) |
