-- Constraint evidence. Expected errors are the point of the file. The whole
-- file rolls back at the end, so it can run repeatedly on a seeded schema.

START TRANSACTION;

-- 1. An ISBN with a wrong check digit is refused.
UPDATE editions SET isbn13 = '9780078022158' WHERE isbn13 = '9780078022159';

-- 2. A barcode outside the LS######## format is refused.
UPDATE copies SET barcode = 'BAD0000001' WHERE barcode = 'LS26000001';

-- 3. A reference copy cannot be issued, even by the desk.
INSERT INTO loans (copy_id, member_id, issued_by, due_at)
SELECT c.copy_id, s.user_id, l.user_id, DATE_ADD(NOW(3), INTERVAL 14 DAY)
  FROM copies c
  JOIN users s ON s.university_id = 'PES1UG24CS001'
  JOIN users l ON l.email = 'librarian@librasearch.local'
 WHERE c.loan_policy = 'REFERENCE_ONLY'
 LIMIT 1;

-- 4. A waiver needs a reason. The second update is the accepted one.
INSERT INTO loans (copy_id, member_id, issued_by, due_at)
SELECT c.copy_id, s.user_id, l.user_id, DATE_ADD(NOW(3), INTERVAL 14 DAY)
  FROM copies c
  JOIN users s ON s.university_id = 'PES1UG24CS001'
  JOIN users l ON l.email = 'librarian@librasearch.local'
 WHERE c.barcode = 'LS26000008'
 LIMIT 1;

INSERT INTO fines (loan_id, amount, days_overdue) VALUES (LAST_INSERT_ID(), 40.00, 8);
UPDATE fines SET status = 'WAIVED', settled_at = NOW(3) WHERE fine_id = LAST_INSERT_ID();
UPDATE fines
   SET status = 'WAIVED',
       settled_at = NOW(3),
       waiver_reason = 'Returned late after a hospital stay; supervisor approved.'
 WHERE fine_id = LAST_INSERT_ID();

-- 5. A negative fine is refused.
INSERT INTO fines (loan_id, amount) VALUES ((SELECT MAX(loan_id) FROM loans), -1);

ROLLBACK;

-- The rows the constraints protected are still there.
SELECT COUNT(*) AS editions FROM editions;
SELECT COUNT(*) AS copies FROM copies;
