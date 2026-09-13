-- Fines with the member, the loan, the copy and the actor who settled them.
-- The desk reads this through the librarian account; it is the evidence trail
-- the audit trigger writes alongside.

CREATE VIEW v_fines AS
SELECT f.fine_id,
       f.loan_id,
       f.amount,
       f.days_overdue,
       f.reason,
       f.status,
       f.created_at,
       f.settled_at,
       f.settled_by,
       f.waiver_reason,
       l.member_id,
       u.full_name AS member_name,
       u.university_id,
       b.book_id,
       b.title,
       c.barcode,
       e.edition_no,
       su.full_name AS settled_by_name
  FROM fines f
  JOIN loans l ON l.loan_id = f.loan_id
  JOIN users u ON u.user_id = l.member_id
  JOIN copies c ON c.copy_id = l.copy_id
  JOIN editions e ON e.edition_id = c.edition_id
  JOIN books b ON b.book_id = e.book_id
  LEFT JOIN users su ON su.user_id = f.settled_by;

GRANT SELECT ON v_fines TO r_librarian;
