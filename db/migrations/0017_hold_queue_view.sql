-- The hold queue a member and the desk both read. Queue position is computed
-- from placed_at, with the hold id breaking a same-millisecond tie.

CREATE VIEW v_hold_queue AS
SELECT h.hold_id,
       h.book_id,
       h.member_id,
       h.status,
       h.placed_at,
       h.ready_at,
       h.pickup_by,
       h.ready_copy_id,
       ROW_NUMBER() OVER (PARTITION BY h.book_id ORDER BY h.placed_at, h.hold_id) AS queue_position,
       b.title,
       (
         SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
           FROM book_authors ba
           JOIN authors a ON a.author_id = ba.author_id
          WHERE ba.book_id = b.book_id
       ) AS authors,
       u.full_name AS member_name,
       u.university_id,
       c.barcode AS ready_barcode,
       c.rack_code AS ready_rack
  FROM holds h
  JOIN books b ON b.book_id = h.book_id
  JOIN users u ON u.user_id = h.member_id
  LEFT JOIN copies c ON c.copy_id = h.ready_copy_id
 WHERE h.status IN ('WAITING', 'READY');

GRANT SELECT ON v_hold_queue TO r_student;
GRANT SELECT ON v_hold_queue TO r_faculty;
GRANT SELECT ON v_hold_queue TO r_librarian;
