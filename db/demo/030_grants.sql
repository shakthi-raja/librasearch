-- Who may do what, from the catalogue inward.

SHOW GRANTS FOR 'app_student'@'%';
SHOW GRANTS FOR 'r_student'@'%';

-- The student account can read the public catalogue view.
SELECT book_id, title FROM v_catalog_public ORDER BY book_id LIMIT 3;

-- The procedure is the student's way to place a hold without table access.
SHOW GRANTS FOR 'r_student'@'%';
