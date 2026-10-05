-- What a scanned copy label shows anyone: the book, the copy's state, where it
-- belongs and, when it is out, when it is due back. Never who has it.

CREATE VIEW v_copy_lookup AS
SELECT c.copy_id,
       c.barcode,
       c.status,
       c.loan_policy,
       c.rack_code,
       c.shelf_code,
       e.edition_id,
       e.edition_no,
       e.pub_year,
       b.book_id,
       b.title,
       b.cover_url,
       (SELECT l.due_at FROM loans l
         WHERE l.copy_id = c.copy_id AND l.returned_at IS NULL) AS due_at
  FROM copies c
  JOIN editions e ON e.edition_id = c.edition_id
  JOIN books b ON b.book_id = e.book_id
 WHERE c.status <> 'WITHDRAWN';

GRANT SELECT ON v_copy_lookup TO r_student;
GRANT SELECT ON v_copy_lookup TO r_faculty;
GRANT SELECT ON v_copy_lookup TO r_librarian;
