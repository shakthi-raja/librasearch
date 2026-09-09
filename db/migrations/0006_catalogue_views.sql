-- Keyword search indexes and the read models the app and reports use.
-- Availability is computed here from copies; it is never stored.

ALTER TABLE books ADD FULLTEXT INDEX ft_books_text (title, subtitle, description);
ALTER TABLE chapters ADD FULLTEXT INDEX ft_chapters_text (title, summary);
ALTER TABLE authors ADD FULLTEXT INDEX ft_authors_name (full_name);

-- Each category with its full path and depth, walked from the roots.
CREATE VIEW v_category_tree AS
WITH RECURSIVE tree (category_id, parent_id, name, slug, root_id, depth, path) AS (
  SELECT c.category_id, c.parent_id, c.name, c.slug, c.category_id, 0, CAST(c.name AS CHAR(600))
    FROM categories c
   WHERE c.parent_id IS NULL
  UNION ALL
  SELECT c.category_id, c.parent_id, c.name, c.slug, t.root_id, t.depth + 1, CONCAT(t.path, ' / ', c.name)
    FROM categories c
    JOIN tree t ON c.parent_id = t.category_id
)
SELECT category_id, parent_id, name, slug, root_id, depth, path
  FROM tree;

-- Copy counts per edition. A borrowable copy is on the shelf and not reference-only.
CREATE VIEW v_edition_availability AS
SELECT e.edition_id,
       e.book_id,
       e.isbn13,
       e.edition_no,
       e.pub_year,
       COUNT(c.copy_id) AS total_copies,
       COALESCE(SUM(c.status = 'AVAILABLE' AND c.loan_policy <> 'REFERENCE_ONLY'), 0) AS available_copies,
       COALESCE(SUM(c.status = 'AVAILABLE' AND c.loan_policy = 'REFERENCE_ONLY'), 0) AS reference_copies,
       COALESCE(SUM(c.status = 'ON_LOAN'), 0) AS on_loan_copies,
       COALESCE(SUM(c.status = 'ON_HOLD_SHELF'), 0) AS on_hold_shelf_copies
  FROM editions e
  LEFT JOIN copies c
         ON c.edition_id = e.edition_id
        AND c.status NOT IN ('LOST', 'WITHDRAWN', 'DAMAGED')
 GROUP BY e.edition_id, e.book_id, e.isbn13, e.edition_no, e.pub_year;

CREATE VIEW v_book_availability AS
SELECT b.book_id,
       COALESCE(SUM(ea.total_copies), 0) AS total_copies,
       COALESCE(SUM(ea.available_copies), 0) AS available_copies,
       COALESCE(SUM(ea.reference_copies), 0) AS reference_copies,
       COALESCE(SUM(ea.on_loan_copies), 0) AS on_loan_copies,
       COALESCE(SUM(ea.on_hold_shelf_copies), 0) AS on_hold_shelf_copies,
       (
         SELECT GROUP_CONCAT(DISTINCT c.rack_code ORDER BY c.rack_code SEPARATOR ',')
           FROM copies c
           JOIN editions e2 ON e2.edition_id = c.edition_id
          WHERE e2.book_id = b.book_id
            AND c.status NOT IN ('LOST', 'WITHDRAWN', 'DAMAGED')
       ) AS racks
  FROM books b
  LEFT JOIN v_edition_availability ea ON ea.book_id = b.book_id
 GROUP BY b.book_id;

-- What a guest may see: active books, their authors, category and shelf state.
-- No internal columns, no copy-level detail.
CREATE VIEW v_catalog_public AS
SELECT b.book_id,
       b.title,
       b.subtitle,
       b.description,
       b.language,
       b.cover_url,
       b.category_id,
       ct.name AS category_name,
       ct.slug AS category_slug,
       ct.path AS category_path,
       (
         SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
           FROM book_authors ba
           JOIN authors a ON a.author_id = ba.author_id
          WHERE ba.book_id = b.book_id
       ) AS authors,
       (SELECT COUNT(*) FROM editions e WHERE e.book_id = b.book_id) AS edition_count,
       (SELECT MAX(e.pub_year) FROM editions e WHERE e.book_id = b.book_id) AS latest_year,
       ba2.total_copies,
       ba2.available_copies,
       ba2.reference_copies,
       ba2.racks
  FROM books b
  JOIN v_category_tree ct ON ct.category_id = b.category_id
  JOIN v_book_availability ba2 ON ba2.book_id = b.book_id
 WHERE b.status = 'ACTIVE';

-- Offering, unit, approved chapter, edition, live availability and rack.
CREATE VIEW v_course_reading_list AS
SELECT o.offering_id,
       co.course_code,
       co.title AS course_title,
       t.name AS term_name,
       su.unit_id,
       su.unit_no,
       su.title AS unit_title,
       ch.chapter_id,
       ch.chapter_no,
       ch.title AS chapter_title,
       ch.page_start,
       ch.page_end,
       e.edition_id,
       e.edition_no,
       e.isbn13,
       b.book_id,
       b.title AS book_title,
       m.similarity,
       ea.available_copies,
       ea.total_copies,
       (
         SELECT GROUP_CONCAT(DISTINCT c.rack_code ORDER BY c.rack_code SEPARATOR ',')
           FROM copies c
          WHERE c.edition_id = e.edition_id
            AND c.status NOT IN ('LOST', 'WITHDRAWN', 'DAMAGED')
       ) AS racks
  FROM course_offerings o
  JOIN courses co ON co.course_id = o.course_id
  JOIN academic_terms t ON t.term_id = o.term_id
  JOIN syllabus_units su ON su.offering_id = o.offering_id
  JOIN unit_chapter_map m ON m.unit_id = su.unit_id AND m.status = 'APPROVED'
  JOIN chapters ch ON ch.chapter_id = m.chapter_id
  JOIN editions e ON e.edition_id = ch.edition_id
  JOIN books b ON b.book_id = e.book_id AND b.status = 'ACTIVE'
  JOIN v_edition_availability ea ON ea.edition_id = e.edition_id;

DELIMITER $$

-- Copies of a book a member could walk out with right now.
CREATE FUNCTION fn_available_copies(p_book_id INT UNSIGNED)
RETURNS INT UNSIGNED
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE n INT UNSIGNED;
  SELECT COUNT(*)
    INTO n
    FROM copies c
    JOIN editions e ON e.edition_id = c.edition_id
    JOIN books b ON b.book_id = e.book_id
   WHERE e.book_id = p_book_id
     AND b.status = 'ACTIVE'
     AND c.status = 'AVAILABLE'
     AND c.loan_policy <> 'REFERENCE_ONLY';
  RETURN n;
END$$

DELIMITER ;
