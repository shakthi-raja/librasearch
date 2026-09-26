-- The books a syllabus prescribes for each course. Textbooks come first in
-- the order the syllabus lists them; references follow. This is the
-- university's prescription, separate from the chapter-level mappings faculty
-- approve, and it is what the library buys copies against.

-- Elective codes in the 2026 syllabus run to thirteen characters (UE24CS342BA10).
ALTER TABLE courses
  DROP CHECK ck_courses_code,
  MODIFY course_code VARCHAR(16) NOT NULL,
  ADD CONSTRAINT ck_courses_code CHECK (REGEXP_LIKE(course_code, '^[A-Z0-9]{5,16}$', 'c'));

CREATE TABLE course_books (
  course_id INT UNSIGNED                    NOT NULL,
  book_id   INT UNSIGNED                    NOT NULL,
  role      ENUM('TEXTBOOK', 'REFERENCE')   NOT NULL,
  position  TINYINT UNSIGNED                NOT NULL,
  added_at  DATETIME(3)                     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_course_books PRIMARY KEY (course_id, book_id),
  CONSTRAINT uq_course_books_position UNIQUE (course_id, role, position),
  CONSTRAINT fk_course_books_course FOREIGN KEY (course_id)
    REFERENCES courses (course_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_course_books_book FOREIGN KEY (book_id)
    REFERENCES books (book_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_course_books_position CHECK (position BETWEEN 1 AND 20),
  INDEX ix_course_books_book (book_id, role)
) ENGINE = InnoDB;

-- Courses that prescribe a book, with what the shelf holds for it right now.
CREATE VIEW v_prescribed_books AS
SELECT cb.course_id,
       c.course_code,
       c.title          AS course_title,
       c.semester,
       cb.book_id,
       b.title          AS book_title,
       cb.role,
       cb.position,
       ba.available_copies,
       ba.total_copies
  FROM course_books cb
  JOIN courses c ON c.course_id = cb.course_id
  JOIN books b ON b.book_id = cb.book_id AND b.status = 'ACTIVE'
  JOIN v_book_availability ba ON ba.book_id = cb.book_id;

GRANT SELECT ON course_books TO r_student;
GRANT SELECT ON course_books TO r_faculty;
GRANT SELECT, INSERT, UPDATE, DELETE ON course_books TO r_librarian;
GRANT SELECT ON v_prescribed_books TO r_student;
GRANT SELECT ON v_prescribed_books TO r_faculty;
GRANT SELECT ON v_prescribed_books TO r_librarian;
