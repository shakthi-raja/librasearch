-- The sign-in path connects as its own account, r_auth. It can read the
-- columns it needs to verify a password and write sessions and attempts,
-- and nothing else. A bug in login cannot touch the catalogue or the desk.
--
-- Roles are server-wide; the grants below are scoped to the current schema.
-- Login accounts and their passwords are provisioned from the environment by
-- scripts/lib/accounts.ts, never written into a migration.

CREATE ROLE IF NOT EXISTS r_auth;

GRANT SELECT (role_id, role_name) ON roles TO r_auth;

GRANT SELECT (
  user_id, role_id, university_id, full_name, email, password_hash, status,
  must_change_password, failed_logins, locked_until, password_changed_at
) ON users TO r_auth;

GRANT UPDATE (
  password_hash, must_change_password, failed_logins, locked_until,
  password_changed_at, last_login_at
) ON users TO r_auth;

GRANT SELECT, INSERT, UPDATE ON auth_sessions TO r_auth;
GRANT SELECT, INSERT ON auth_attempts TO r_auth;
