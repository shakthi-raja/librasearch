# Operations

Backups, restores and the account tasks that have no screen yet. Commands
run from the repository root and read their settings from `.env`:

```bash
set -a; . ./.env; set +a
```

## What to back up

| Store | Back up? | Why |
|---|---|---|
| MySQL | Yes | The only source of truth: members, catalogue, loans, fines, holds, audit |
| Qdrant | No | Rebuilt from MySQL with `pnpm worker:rebuild` (about a minute) |
| Redis | No | Caches, counters and live messages only; they refill on their own |

## Backup

A consistent dump without locking the desk, including procedures, functions,
triggers and scheduled events:

```bash
mkdir -p backups
docker compose exec -T mysql mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --routines --triggers --events --set-gtid-purged=OFF \
  "$DB_NAME" | gzip > "backups/$DB_NAME-$(date +%F).sql.gz"
```

Keep the files somewhere other than this machine. A dump of the seeded
library is about 1.2 MB before compression.

## Restore

1. Stop the web app and the worker, so nothing writes during the restore.
2. Recreate the database and load the dump:

   ```bash
   docker compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \
     -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
   gunzip -c "backups/$DB_NAME-2026-11-13.sql.gz" | \
     docker compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"
   ```

3. Rebuild the vector index from the restored rows, then start the app and
   the worker again:

   ```bash
   pnpm worker:rebuild
   ```

The application accounts and their roles live in MySQL's own system schema,
so they survive the drop and keep their grants. On a brand-new server, run
`pnpm db:migrate` once before step 2 so the roles and accounts exist.

`pnpm db:status` after a restore should list every migration as applied.

## Accounts

Members are created by `pnpm db:seed` today; there is no members screen yet.
The schema already carries what one needs: `users.status` (ACTIVE,
SUSPENDED, GRADUATED), the lockout counters, and `must_change_password`.
Until that screen exists, use these statements as the admin database account.
Each change to a user is written to `audit_log` by trigger, and a change of
role, status or password signs the member out of every session.

Set the acting librarian first so the audit log names them:

```sql
SET @app_user_id = (SELECT user_id FROM users WHERE university_id = 'LIB0001');
```

### Suspend, reactivate or graduate

```sql
UPDATE users SET status = 'SUSPENDED' WHERE university_id = 'PES1UG24CS010';
UPDATE users SET status = 'ACTIVE'    WHERE university_id = 'PES1UG24CS010';
```

A member who is not ACTIVE cannot sign in, and `sp_issue_copy` refuses them
(LS001).

### Unlock after failed sign-ins

Five wrong passwords in a row lock an account for 15 minutes. To lift it
early:

```sql
UPDATE users SET failed_logins = 0, locked_until = NULL
 WHERE university_id = 'PES1UG24CS010';
```

### Set a new password

Passwords are stored as Argon2id hashes and are never set in plain SQL. Make
a hash with the same parameters the app uses (`src/server/auth/password.ts`):

```bash
node -e "require('@node-rs/argon2').hash(process.argv[1].normalize('NFKC'), \
  {algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32}) \
  .then((h) => console.log(h))" 'the-new-password'
```

Then store it, and give the member the password in person:

```sql
UPDATE users SET password_hash = '<the hash printed above>',
                 failed_logins = 0, locked_until = NULL
 WHERE university_id = 'PES1UG24CS010';
```

### Add a member

With a hash made as above:

```sql
INSERT INTO users (role_id, dept_id, university_id, full_name, email,
                   password_hash, program, batch_year)
SELECT r.role_id, d.dept_id, 'PES1UG25CS101', 'Member Name',
       'member.name@example.org', '<hash>', 'B.Tech CSE', 2025
  FROM roles r JOIN departments d ON d.dept_code = 'CSE'
 WHERE r.role_name = 'STUDENT';
```

The schema checks the university ID format, the email format and that both
are unique. For faculty or a librarian, use that role name and set
`designation` instead of `program` and `batch_year`.
