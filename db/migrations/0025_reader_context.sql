-- Search ranks a student's own syllabus first, so the student role reads
-- which offerings a member is enrolled in. The application always scopes the
-- query to the signed-in member; the column grant keeps the rest out of reach.

GRANT SELECT (student_id, offering_id, status) ON enrollments TO r_student;
