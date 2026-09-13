# SQL evidence

Each script runs against the seeded development schema and prints the database
refusing bad data or showing the evidence a viva asks for. Run them with
`--force` so one expected error does not stop the rest of the file.

```bash
docker exec -i librasearch-mysql-1 mysql -uroot -p"$DB_ADMIN_PASSWORD" librasearch --force < db/demo/010_constraints.sql
docker exec -i librasearch-mysql-1 mysql -uroot -p"$DB_ADMIN_PASSWORD" librasearch --force < db/demo/020_locks.sql
docker exec -i librasearch-mysql-1 mysql -uroot -p"$DB_ADMIN_PASSWORD" librasearch --force < db/demo/030_grants.sql
```

The grant boundary is best shown from the application account, which is where
error 1142 comes from:

```bash
docker exec -i librasearch-mysql-1 mysql -uapp_student -p"$DB_STUDENT_PASSWORD" librasearch \
  -e "UPDATE loans SET due_at = NOW(3);"
# ERROR 1142 (42000): UPDATE command denied to user 'app_student'@'%' for table 'loans'
```

CI runs all three scripts on the seeded schema after the database suite.
