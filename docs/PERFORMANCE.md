# Query plans behind the operational screens

The screens added in phase four read three hot paths on every visit: the next
exam of an offering, the thirty-day loan window, and the waiting-hold count.
Migration `0021_performance_indexes.sql` gives each one an index, and the plans
below (MariaDB `EXPLAIN`, development data) show the change.

## Next exam for an offering

```sql
SELECT MIN(start_date) FROM exam_windows
 WHERE offering_id = ? AND end_date >= CURDATE();
```

Before the migration the optimizer had only the unique `(offering_id, exam_type)`
index to find the offering's two exam rows and filtered the date in memory. The
new `(offering_id, end_date)` index keeps the lookup and the range on the same
index for offerings with more windows; with two rows per offering the cost is
already flat:

```
Aggregate: min(exam_windows.start_date)
  Filter: exam_windows.end_date >= curdate()
    Index lookup on exam_windows using uq_exam_windows_type (offering_id = 1)
```

## Loans in the last thirty days

```sql
SELECT COUNT(*) FROM loans WHERE issued_at >= NOW() - INTERVAL 30 DAY;
```

Without an index on `issued_at` the planner scanned the copy index. Now the
count is answered from the covering `ix_loans_issued` index:

```
Aggregate: count(0)
  Filter: loans.issued_at >= now() - interval 30 day
    Covering index scan on loans using ix_loans_issued
```

## Waiting holds

```sql
SELECT COUNT(*) FROM holds WHERE status = 'WAITING';
```

`ix_holds_status (status, placed_at)` turns the desk badge count into a covering
index lookup instead of a scan of the member index:

```
Aggregate: count(0)
  Filter: holds.status = 'WAITING'
    Covering index lookup on holds using ix_holds_status (status = 'WAITING')
```

The schema tests in `tests/db/performance-indexes.test.ts` assert the three
indexes exist with the expected column order, so a future migration cannot drop
them silently.
