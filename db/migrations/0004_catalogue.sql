-- Catalogue: the classification tree, publishers and authors, books (the
-- intellectual work), editions (a published version with an ISBN), chapters
-- (the table of contents search runs over) and copies (the physical objects
-- on a rack). Availability is never stored; it is derived from copies.

CREATE TABLE categories (
  category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id   INT UNSIGNED NULL,
  name        VARCHAR(80)  NOT NULL,
  slug        VARCHAR(80)  NOT NULL,
  description VARCHAR(300) NULL,
  CONSTRAINT pk_categories PRIMARY KEY (category_id),
  CONSTRAINT uq_categories_slug UNIQUE (slug),
  CONSTRAINT uq_categories_sibling_name UNIQUE (parent_id, name),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
    REFERENCES categories (category_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_categories_slug CHECK (REGEXP_LIKE(slug, '^[a-z0-9]+(-[a-z0-9]+)*$', 'c'))
) ENGINE = InnoDB;

CREATE TABLE publishers (
  publisher_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(120) NOT NULL,
  city         VARCHAR(80)  NULL,
  website      VARCHAR(200) NULL,
  CONSTRAINT pk_publishers PRIMARY KEY (publisher_id),
  CONSTRAINT uq_publishers_name UNIQUE (name),
  CONSTRAINT ck_publishers_website CHECK (website IS NULL OR website LIKE 'https://%')
) ENGINE = InnoDB;

CREATE TABLE authors (
  author_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  bio       TEXT         NULL,
  country   CHAR(2)      NULL,
  CONSTRAINT pk_authors PRIMARY KEY (author_id),
  CONSTRAINT ck_authors_country CHECK (country IS NULL OR REGEXP_LIKE(country, '^[A-Z]{2}$', 'c')),
  INDEX ix_authors_name (full_name)
) ENGINE = InnoDB;

CREATE TABLE books (
  book_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  subtitle    VARCHAR(200) NULL,
  description TEXT         NOT NULL,
  language    CHAR(2)      NOT NULL DEFAULT 'en',
  cover_url   VARCHAR(500) NULL,
  status      ENUM('ACTIVE', 'WITHDRAWN') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_books PRIMARY KEY (book_id),
  CONSTRAINT fk_books_category FOREIGN KEY (category_id)
    REFERENCES categories (category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_books_title CHECK (CHAR_LENGTH(TRIM(title)) >= 1),
  CONSTRAINT ck_books_language CHECK (REGEXP_LIKE(language, '^[a-z]{2}$', 'c')),
  CONSTRAINT ck_books_cover CHECK (cover_url IS NULL OR cover_url LIKE 'https://%' OR cover_url LIKE '/%'),
  INDEX ix_books_category (category_id, status)
) ENGINE = InnoDB;

CREATE TABLE book_authors (
  book_id      INT UNSIGNED     NOT NULL,
  author_id    INT UNSIGNED     NOT NULL,
  author_order TINYINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT pk_book_authors PRIMARY KEY (book_id, author_id),
  CONSTRAINT uq_book_authors_order UNIQUE (book_id, author_order),
  CONSTRAINT fk_book_authors_book FOREIGN KEY (book_id)
    REFERENCES books (book_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_book_authors_author FOREIGN KEY (author_id)
    REFERENCES authors (author_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_book_authors_order CHECK (author_order >= 1),
  INDEX ix_book_authors_author (author_id)
) ENGINE = InnoDB;

CREATE TABLE editions (
  edition_id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  book_id             INT UNSIGNED      NOT NULL,
  isbn13              CHAR(13)          NOT NULL,
  edition_no          TINYINT UNSIGNED  NOT NULL,
  publisher_id        INT UNSIGNED      NULL,
  pub_year            SMALLINT UNSIGNED NOT NULL,
  page_count          SMALLINT UNSIGNED NOT NULL,
  format              ENUM('HARDCOVER', 'PAPERBACK') NOT NULL DEFAULT 'PAPERBACK',
  previous_edition_id INT UNSIGNED      NULL,
  created_at          DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_editions PRIMARY KEY (edition_id),
  CONSTRAINT uq_editions_isbn UNIQUE (isbn13),
  CONSTRAINT uq_editions_number UNIQUE (book_id, edition_no),
  CONSTRAINT fk_editions_book FOREIGN KEY (book_id)
    REFERENCES books (book_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_editions_publisher FOREIGN KEY (publisher_id)
    REFERENCES publishers (publisher_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_editions_previous FOREIGN KEY (previous_edition_id)
    REFERENCES editions (edition_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_editions_isbn_format CHECK (REGEXP_LIKE(isbn13, '^97[89][0-9]{10}$')),
  -- ISBN-13 check digit: weights alternate 1 and 3 over the first twelve digits
  CONSTRAINT ck_editions_isbn_checksum CHECK (
    (10 - (
        CAST(SUBSTRING(isbn13, 1, 1) AS UNSIGNED)
      + CAST(SUBSTRING(isbn13, 2, 1) AS UNSIGNED) * 3
      + CAST(SUBSTRING(isbn13, 3, 1) AS UNSIGNED)
      + CAST(SUBSTRING(isbn13, 4, 1) AS UNSIGNED) * 3
      + CAST(SUBSTRING(isbn13, 5, 1) AS UNSIGNED)
      + CAST(SUBSTRING(isbn13, 6, 1) AS UNSIGNED) * 3
      + CAST(SUBSTRING(isbn13, 7, 1) AS UNSIGNED)
      + CAST(SUBSTRING(isbn13, 8, 1) AS UNSIGNED) * 3
      + CAST(SUBSTRING(isbn13, 9, 1) AS UNSIGNED)
      + CAST(SUBSTRING(isbn13, 10, 1) AS UNSIGNED) * 3
      + CAST(SUBSTRING(isbn13, 11, 1) AS UNSIGNED)
      + CAST(SUBSTRING(isbn13, 12, 1) AS UNSIGNED) * 3
    ) % 10) % 10 = CAST(SUBSTRING(isbn13, 13, 1) AS UNSIGNED)
  ),
  CONSTRAINT ck_editions_number CHECK (edition_no BETWEEN 1 AND 50),
  CONSTRAINT ck_editions_year CHECK (pub_year BETWEEN 1900 AND 2100),
  CONSTRAINT ck_editions_pages CHECK (page_count BETWEEN 1 AND 5000),
  INDEX ix_editions_previous (previous_edition_id)
) ENGINE = InnoDB;

CREATE TABLE chapters (
  chapter_id       INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  edition_id       INT UNSIGNED      NOT NULL,
  chapter_no       SMALLINT UNSIGNED NOT NULL,
  title            VARCHAR(200)      NOT NULL,
  page_start       SMALLINT UNSIGNED NOT NULL,
  page_end         SMALLINT UNSIGNED NOT NULL,
  summary          TEXT              NOT NULL,
  embedding_status ENUM('PENDING', 'SYNCED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  embedded_at      DATETIME(3)       NULL,
  CONSTRAINT pk_chapters PRIMARY KEY (chapter_id),
  CONSTRAINT uq_chapters_number UNIQUE (edition_id, chapter_no),
  CONSTRAINT fk_chapters_edition FOREIGN KEY (edition_id)
    REFERENCES editions (edition_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_chapters_number CHECK (chapter_no BETWEEN 1 AND 200),
  CONSTRAINT ck_chapters_pages CHECK (page_start > 0 AND page_end >= page_start),
  CONSTRAINT ck_chapters_summary CHECK (CHAR_LENGTH(TRIM(summary)) >= 40),
  CONSTRAINT ck_chapters_embedded CHECK (embedding_status <> 'SYNCED' OR embedded_at IS NOT NULL)
) ENGINE = InnoDB;

CREATE TABLE copies (
  copy_id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  edition_id       INT UNSIGNED   NOT NULL,
  accession_no     VARCHAR(16)    NOT NULL,
  barcode          CHAR(10)       NOT NULL,
  rack_code        VARCHAR(8)     NOT NULL,
  shelf_code       VARCHAR(4)     NOT NULL,
  status           ENUM('AVAILABLE', 'ON_LOAN', 'ON_HOLD_SHELF', 'LOST', 'DAMAGED', 'WITHDRAWN')
                                  NOT NULL DEFAULT 'AVAILABLE',
  loan_policy      ENUM('REGULAR', 'SHORT_LOAN', 'REFERENCE_ONLY') NOT NULL DEFAULT 'REGULAR',
  condition_state  ENUM('NEW', 'GOOD', 'WORN', 'POOR') NOT NULL DEFAULT 'NEW',
  acquired_on      DATE           NOT NULL,
  acquisition_cost DECIMAL(10, 2) NULL,
  source           ENUM('PURCHASE', 'DONATION', 'TRANSFER') NOT NULL DEFAULT 'PURCHASE',
  created_at       DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_copies PRIMARY KEY (copy_id),
  CONSTRAINT uq_copies_accession UNIQUE (accession_no),
  CONSTRAINT uq_copies_barcode UNIQUE (barcode),
  CONSTRAINT fk_copies_edition FOREIGN KEY (edition_id)
    REFERENCES editions (edition_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_copies_accession CHECK (REGEXP_LIKE(accession_no, '^ACC-[0-9]{4}-[0-9]{5}$', 'c')),
  CONSTRAINT ck_copies_barcode CHECK (REGEXP_LIKE(barcode, '^LS[0-9]{8}$', 'c')),
  CONSTRAINT ck_copies_rack CHECK (REGEXP_LIKE(rack_code, '^[A-Z]{2,3}-[0-9]{2}$', 'c')),
  CONSTRAINT ck_copies_shelf CHECK (REGEXP_LIKE(shelf_code, '^S[1-9]$', 'c')),
  CONSTRAINT ck_copies_cost CHECK (acquisition_cost IS NULL OR acquisition_cost >= 0),
  -- a reference copy never leaves the building
  CONSTRAINT ck_copies_reference_on_loan CHECK (NOT (loan_policy = 'REFERENCE_ONLY' AND status = 'ON_LOAN')),
  INDEX ix_copies_edition_status (edition_id, status),
  INDEX ix_copies_rack (rack_code)
) ENGINE = InnoDB;

CREATE TABLE tags (
  tag_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name   VARCHAR(60)  NOT NULL,
  slug   VARCHAR(60)  NOT NULL,
  CONSTRAINT pk_tags PRIMARY KEY (tag_id),
  CONSTRAINT uq_tags_slug UNIQUE (slug),
  CONSTRAINT ck_tags_slug CHECK (REGEXP_LIKE(slug, '^[a-z0-9]+(-[a-z0-9]+)*$', 'c'))
) ENGINE = InnoDB;

CREATE TABLE book_tags (
  book_id INT UNSIGNED NOT NULL,
  tag_id  INT UNSIGNED NOT NULL,
  CONSTRAINT pk_book_tags PRIMARY KEY (book_id, tag_id),
  CONSTRAINT fk_book_tags_book FOREIGN KEY (book_id)
    REFERENCES books (book_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_book_tags_tag FOREIGN KEY (tag_id)
    REFERENCES tags (tag_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX ix_book_tags_tag (tag_id)
) ENGINE = InnoDB;

DELIMITER $$

-- The category tree must stay a tree: a node cannot become its own ancestor.
CREATE TRIGGER trg_categories_bu
BEFORE UPDATE ON categories
FOR EACH ROW
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT (NEW.parent_id <=> OLD.parent_id) THEN
    IF NEW.parent_id = NEW.category_id OR EXISTS (
      WITH RECURSIVE descendants (category_id) AS (
        SELECT c.category_id FROM categories c WHERE c.parent_id = NEW.category_id
        UNION ALL
        SELECT c.category_id FROM categories c JOIN descendants d ON c.parent_id = d.category_id
      )
      SELECT 1 FROM descendants WHERE category_id = NEW.parent_id
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS201: a category cannot sit under its own subtree';
    END IF;
  END IF;
END$$

-- A previous edition belongs to the same book and carries a lower number.
CREATE TRIGGER trg_editions_bi
BEFORE INSERT ON editions
FOR EACH ROW
BEGIN
  IF NEW.previous_edition_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM editions p
     WHERE p.edition_id = NEW.previous_edition_id
       AND p.book_id = NEW.book_id
       AND p.edition_no < NEW.edition_no
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS202: previous edition must be an earlier edition of the same book';
  END IF;
END$$

CREATE TRIGGER trg_editions_bu
BEFORE UPDATE ON editions
FOR EACH ROW
BEGIN
  IF NEW.previous_edition_id IS NOT NULL AND (
    NEW.previous_edition_id = NEW.edition_id OR NOT EXISTS (
      SELECT 1 FROM editions p
       WHERE p.edition_id = NEW.previous_edition_id
         AND p.book_id = NEW.book_id
         AND p.edition_no < NEW.edition_no
    )
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS202: previous edition must be an earlier edition of the same book';
  END IF;
END$$

-- Chapters cannot run past the end of their edition.
CREATE TRIGGER trg_chapters_bi
BEFORE INSERT ON chapters
FOR EACH ROW
BEGIN
  IF NEW.page_end > (SELECT e.page_count FROM editions e WHERE e.edition_id = NEW.edition_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS203: chapter pages run past the end of the edition';
  END IF;
END$$

CREATE TRIGGER trg_chapters_bu
BEFORE UPDATE ON chapters
FOR EACH ROW
BEGIN
  IF NEW.page_end > (SELECT e.page_count FROM editions e WHERE e.edition_id = NEW.edition_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS203: chapter pages run past the end of the edition';
  END IF;
END$$

DELIMITER ;
