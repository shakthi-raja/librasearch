-- Database roles mirror the application roles. Each application account is
-- granted exactly one role (scripts/lib/accounts.ts), so MySQL enforces the
-- same boundary as the app: a bug in a student page still cannot write a loan.
--
-- Views run with definer rights, so a role reads a view without reading the
-- tables behind it. MySQL has no row-level security; which member's rows a
-- request may see is decided by the session in the app and by definer
-- routines that take the member id from the session, never from the client.
-- Later migrations extend these grants as routines and views arrive.

CREATE ROLE IF NOT EXISTS r_student, r_faculty, r_librarian;

-- Students and guests: the public catalogue, availability and academic reads.
GRANT SELECT ON v_catalog_public TO r_student;
GRANT SELECT ON v_category_tree TO r_student;
GRANT SELECT ON v_book_availability TO r_student;
GRANT SELECT ON v_edition_availability TO r_student;
GRANT SELECT ON v_course_reading_list TO r_student;

GRANT SELECT ON categories TO r_student;
GRANT SELECT ON publishers TO r_student;
GRANT SELECT ON authors TO r_student;
GRANT SELECT ON books TO r_student;
GRANT SELECT ON book_authors TO r_student;
GRANT SELECT ON editions TO r_student;
GRANT SELECT ON chapters TO r_student;
GRANT SELECT ON tags TO r_student;
GRANT SELECT ON book_tags TO r_student;
-- copy rows without cost or provenance
GRANT SELECT (copy_id, edition_id, rack_code, shelf_code, status, loan_policy) ON copies TO r_student;

GRANT SELECT ON academic_terms TO r_student;
GRANT SELECT ON courses TO r_student;
GRANT SELECT ON course_offerings TO r_student;
GRANT SELECT ON syllabus_units TO r_student;
GRANT SELECT ON exam_windows TO r_student;
GRANT SELECT ON departments TO r_student;
GRANT SELECT ON library_settings TO r_student;

GRANT INSERT ON search_log TO r_student;
GRANT UPDATE (clicked_book_id, clicked_at) ON search_log TO r_student;

GRANT EXECUTE ON FUNCTION fn_available_copies TO r_student;

-- Faculty: everything a student has, plus authority over syllabus mapping.
GRANT r_student TO r_faculty;
GRANT SELECT ON enrollments TO r_faculty;
GRANT INSERT, UPDATE (title, topics, hours, unit_no) ON syllabus_units TO r_faculty;
GRANT SELECT, INSERT ON unit_chapter_map TO r_faculty;
GRANT UPDATE (status, reviewed_by, reviewed_at) ON unit_chapter_map TO r_faculty;

-- Librarians: operational reads and writes across the schema. Routines get
-- EXECUTE through the same schema-level grant.
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE, SHOW VIEW ON * TO r_librarian;
