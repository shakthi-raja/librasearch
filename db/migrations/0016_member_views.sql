-- Member read models. They run with definer rights, so a student account reads
-- its own rows through the view without gaining SELECT on the tables behind it.
-- The API still adds the ownership predicate from the session; the view is not
-- row-level security.

CREATE VIEW v_member_loans AS
SELECT l.loan_id,
       l.member_id,
       l.copy_id,
       e.book_id,
       b.title,
       (
         SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
           FROM book_authors ba
           JOIN authors a ON a.author_id = ba.author_id
          WHERE ba.book_id = b.book_id
       ) AS authors,
       e.edition_no,
       e.isbn13,
       c.barcode,
       c.rack_code,
       c.shelf_code,
       l.issued_at,
       l.due_at,
       l.returned_at,
       l.end_reason,
       l.renew_count,
       l.period_rule,
       GREATEST(DATEDIFF(NOW(3), l.due_at), 0) AS days_overdue,
       (
         SELECT COALESCE(SUM(f.amount), 0)
           FROM fines f
          WHERE f.loan_id = l.loan_id
            AND f.status = 'UNPAID'
       ) AS fine_due
  FROM loans l
  JOIN copies c ON c.copy_id = l.copy_id
  JOIN editions e ON e.edition_id = c.edition_id
  JOIN books b ON b.book_id = e.book_id;

CREATE VIEW v_member_overview AS
SELECT u.user_id,
       u.university_id,
       u.full_name,
       u.email,
       u.status,
       r.role_name,
       r.max_loans,
       r.max_renewals,
       r.loan_days,
       (
         SELECT COUNT(*)
           FROM loans l
          WHERE l.member_id = u.user_id
            AND l.returned_at IS NULL
            AND l.end_reason IS NULL
       ) AS active_loans,
       (
         SELECT COALESCE(SUM(f.amount), 0)
           FROM fines f
           JOIN loans l ON l.loan_id = f.loan_id
          WHERE l.member_id = u.user_id
            AND f.status = 'UNPAID'
       ) AS unpaid_fines
  FROM users u
  JOIN roles r ON r.role_id = u.role_id;

GRANT SELECT ON v_member_loans TO r_student;
GRANT SELECT ON v_member_loans TO r_faculty;
GRANT SELECT ON v_member_loans TO r_librarian;
GRANT SELECT ON v_member_overview TO r_student;
GRANT SELECT ON v_member_overview TO r_faculty;
GRANT SELECT ON v_member_overview TO r_librarian;
