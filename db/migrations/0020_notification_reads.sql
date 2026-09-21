-- Members read their own notices and mark them read. The application always
-- scopes the query by the signed-in user; the grant keeps the role honest.

GRANT SELECT, UPDATE (read_at) ON notifications TO r_student;
GRANT SELECT, UPDATE (read_at) ON notifications TO r_faculty;
