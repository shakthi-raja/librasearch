-- The open shelf: books and course material their authors publish for free,
-- linked to the catalogue record. The library links to the authors' own
-- copy; it never hosts a copyrighted file or lends a digital copy.

CREATE TABLE open_resources (
  resource_id INT UNSIGNED                              NOT NULL AUTO_INCREMENT,
  book_id     INT UNSIGNED                              NOT NULL,
  url         VARCHAR(500)                              NOT NULL,
  kind        ENUM('FULL_TEXT', 'CHAPTERS', 'LECTURES') NOT NULL DEFAULT 'FULL_TEXT',
  provider    VARCHAR(120)                              NOT NULL,
  licence     VARCHAR(60)                               NULL,
  status      ENUM('ACTIVE', 'BROKEN')                  NOT NULL DEFAULT 'ACTIVE',
  checked_at  DATETIME(3)                               NULL,
  added_by    INT UNSIGNED                              NULL,
  created_at  DATETIME(3)                               NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_open_resources PRIMARY KEY (resource_id),
  CONSTRAINT uq_open_resources_link UNIQUE (book_id, url),
  CONSTRAINT fk_open_resources_book FOREIGN KEY (book_id)
    REFERENCES books (book_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_open_resources_added_by FOREIGN KEY (added_by)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_open_resources_url CHECK (url LIKE 'https://%'),
  CONSTRAINT ck_open_resources_provider CHECK (CHAR_LENGTH(TRIM(provider)) >= 3),
  INDEX ix_open_resources_status (status, book_id)
) ENGINE = InnoDB;

-- What readers see: working links for books still on the catalogue.
CREATE VIEW v_open_shelf AS
SELECT r.resource_id,
       r.url,
       r.kind,
       r.provider,
       r.licence,
       b.book_id,
       b.title,
       b.cover_url,
       ct.name AS category_name,
       ct.path AS category_path,
       (
         SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
           FROM book_authors ba
           JOIN authors a ON a.author_id = ba.author_id
          WHERE ba.book_id = b.book_id
       ) AS authors
  FROM open_resources r
  JOIN books b ON b.book_id = r.book_id AND b.status = 'ACTIVE'
  JOIN v_category_tree ct ON ct.category_id = b.category_id
 WHERE r.status = 'ACTIVE';

GRANT SELECT ON v_open_shelf TO r_student;
GRANT SELECT ON v_open_shelf TO r_faculty;
GRANT SELECT ON v_open_shelf TO r_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON open_resources TO r_librarian;
