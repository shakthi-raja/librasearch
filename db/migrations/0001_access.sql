-- Access module: roles and their borrowing policy, departments, people,
-- server-side sessions and login attempts.
--
-- Timestamps are DATETIME(3) in UTC. The server and every pool run with
-- time_zone '+00:00', so CURRENT_TIMESTAMP is UTC.

CREATE TABLE roles (
  role_id      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  role_name    VARCHAR(20)      NOT NULL,
  description  VARCHAR(200)     NOT NULL,
  max_loans    TINYINT UNSIGNED NOT NULL,
  max_renewals TINYINT UNSIGNED NOT NULL,
  loan_days    TINYINT UNSIGNED NOT NULL,
  created_at   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_roles PRIMARY KEY (role_id),
  CONSTRAINT uq_roles_name UNIQUE (role_name),
  CONSTRAINT ck_roles_name CHECK (role_name IN ('STUDENT', 'FACULTY', 'LIBRARIAN')),
  CONSTRAINT ck_roles_max_loans CHECK (max_loans BETWEEN 0 AND 20),
  CONSTRAINT ck_roles_max_renewals CHECK (max_renewals BETWEEN 0 AND 5),
  CONSTRAINT ck_roles_loan_days CHECK (loan_days > 0)
) ENGINE = InnoDB;

CREATE TABLE departments (
  dept_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dept_code  VARCHAR(10)  NOT NULL,
  dept_name  VARCHAR(120) NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_departments PRIMARY KEY (dept_id),
  CONSTRAINT uq_departments_code UNIQUE (dept_code),
  CONSTRAINT uq_departments_name UNIQUE (dept_name),
  CONSTRAINT ck_departments_code CHECK (REGEXP_LIKE(dept_code, '^[A-Z]{2,10}$', 'c'))
) ENGINE = InnoDB;

CREATE TABLE users (
  user_id              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  role_id              INT UNSIGNED      NOT NULL,
  dept_id              INT UNSIGNED      NULL,
  university_id        VARCHAR(20)       NOT NULL,
  full_name            VARCHAR(120)      NOT NULL,
  email                VARCHAR(254)      NOT NULL,
  phone                VARCHAR(15)       NULL,
  password_hash        VARCHAR(255)      NOT NULL,
  status               ENUM('ACTIVE', 'SUSPENDED', 'GRADUATED') NOT NULL DEFAULT 'ACTIVE',
  must_change_password BOOLEAN           NOT NULL DEFAULT FALSE,
  program              VARCHAR(60)       NULL,
  batch_year           SMALLINT UNSIGNED NULL,
  designation          VARCHAR(60)       NULL,
  failed_logins        TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  locked_until         DATETIME(3)       NULL,
  password_changed_at  DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_login_at        DATETIME(3)       NULL,
  created_at           DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_users PRIMARY KEY (user_id),
  CONSTRAINT uq_users_university_id UNIQUE (university_id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id)
    REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_users_department FOREIGN KEY (dept_id)
    REFERENCES departments (dept_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_users_university_id CHECK (REGEXP_LIKE(university_id, '^[A-Z0-9]{4,20}$', 'c')),
  CONSTRAINT ck_users_email CHECK (
    REGEXP_LIKE(email, '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$', 'c')
  ),
  CONSTRAINT ck_users_phone CHECK (phone IS NULL OR REGEXP_LIKE(phone, '^\\+?[0-9]{10,14}$')),
  CONSTRAINT ck_users_password_hash CHECK (password_hash LIKE '$argon2id$%'),
  CONSTRAINT ck_users_full_name CHECK (CHAR_LENGTH(TRIM(full_name)) >= 2),
  CONSTRAINT ck_users_batch_year CHECK (batch_year IS NULL OR batch_year BETWEEN 2000 AND 2100),
  INDEX ix_users_role_status (role_id, status),
  INDEX ix_users_department (dept_id)
) ENGINE = InnoDB;

CREATE TABLE auth_sessions (
  session_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED    NOT NULL,
  token_hash   CHAR(64)        NOT NULL,
  ip           VARCHAR(45)     NULL,
  user_agent   VARCHAR(255)    NULL,
  created_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at   DATETIME(3)     NOT NULL,
  revoked_at   DATETIME(3)     NULL,
  CONSTRAINT pk_auth_sessions PRIMARY KEY (session_id),
  CONSTRAINT uq_auth_sessions_token UNIQUE (token_hash),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_auth_sessions_token CHECK (REGEXP_LIKE(token_hash, '^[0-9a-f]{64}$', 'c')),
  CONSTRAINT ck_auth_sessions_expiry CHECK (expires_at > created_at),
  CONSTRAINT ck_auth_sessions_revoked CHECK (revoked_at IS NULL OR revoked_at >= created_at),
  INDEX ix_auth_sessions_user_expiry (user_id, expires_at)
) ENGINE = InnoDB;

CREATE TABLE auth_attempts (
  attempt_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier   VARCHAR(254)    NOT NULL,
  ip           VARCHAR(45)     NULL,
  success      BOOLEAN         NOT NULL,
  attempted_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_auth_attempts PRIMARY KEY (attempt_id),
  INDEX ix_auth_attempts_identifier (identifier, attempted_at),
  INDEX ix_auth_attempts_ip (ip, attempted_at)
) ENGINE = InnoDB;

-- Borrowing policy belongs to the role, so the database can enforce it.
INSERT INTO roles (role_name, description, max_loans, max_renewals, loan_days) VALUES
  ('STUDENT', 'Enrolled student: borrows, holds, reads course reading lists', 4, 2, 14),
  ('FACULTY', 'Teaching staff: everything a student can do, plus syllabus mapping', 10, 3, 14),
  ('LIBRARIAN', 'Library staff: runs the desk, catalogue and policy; no personal borrowing', 0, 0, 14);
