-- Academic structure: terms, the course catalogue, offerings of a course in a
-- term, enrollments, syllabus units, exam windows, closed days and the single
-- row of library policy.
--
-- A course is a catalogue entry; an offering is that course taught in one term
-- and section. Enrollments, units and exams hang off the offering so history
-- survives from term to term.

CREATE TABLE academic_terms (
  term_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(40)  NOT NULL,
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  is_current   BOOLEAN      NOT NULL DEFAULT FALSE,
  -- NULL for every term but the current one, so the unique index allows one
  current_flag TINYINT UNSIGNED GENERATED ALWAYS AS (IF(is_current, 1, NULL)) STORED,
  CONSTRAINT pk_academic_terms PRIMARY KEY (term_id),
  CONSTRAINT uq_academic_terms_name UNIQUE (name),
  CONSTRAINT uq_academic_terms_current UNIQUE (current_flag),
  CONSTRAINT ck_academic_terms_dates CHECK (end_date >= start_date)
) ENGINE = InnoDB;

CREATE TABLE courses (
  course_id   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(12)      NOT NULL,
  title       VARCHAR(160)     NOT NULL,
  dept_id     INT UNSIGNED     NOT NULL,
  semester    TINYINT UNSIGNED NOT NULL,
  credits     TINYINT UNSIGNED NOT NULL,
  description TEXT             NULL,
  created_at  DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_courses PRIMARY KEY (course_id),
  CONSTRAINT uq_courses_code UNIQUE (course_code),
  CONSTRAINT fk_courses_department FOREIGN KEY (dept_id)
    REFERENCES departments (dept_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_courses_code CHECK (REGEXP_LIKE(course_code, '^[A-Z0-9]{5,12}$', 'c')),
  CONSTRAINT ck_courses_semester CHECK (semester BETWEEN 1 AND 8),
  CONSTRAINT ck_courses_credits CHECK (credits BETWEEN 1 AND 6),
  INDEX ix_courses_department (dept_id, semester)
) ENGINE = InnoDB;

CREATE TABLE course_offerings (
  offering_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id      INT UNSIGNED NOT NULL,
  term_id        INT UNSIGNED NOT NULL,
  section        CHAR(1)      NOT NULL DEFAULT 'A',
  coordinator_id INT UNSIGNED NULL,
  status         ENUM('PLANNED', 'RUNNING', 'COMPLETED') NOT NULL DEFAULT 'PLANNED',
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_course_offerings PRIMARY KEY (offering_id),
  CONSTRAINT uq_course_offerings_section UNIQUE (course_id, term_id, section),
  CONSTRAINT fk_course_offerings_course FOREIGN KEY (course_id)
    REFERENCES courses (course_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_course_offerings_term FOREIGN KEY (term_id)
    REFERENCES academic_terms (term_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_course_offerings_coordinator FOREIGN KEY (coordinator_id)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_course_offerings_section CHECK (REGEXP_LIKE(section, '^[A-Z]$', 'c')),
  INDEX ix_course_offerings_term (term_id, status),
  INDEX ix_course_offerings_coordinator (coordinator_id)
) ENGINE = InnoDB;

CREATE TABLE enrollments (
  student_id  INT UNSIGNED NOT NULL,
  offering_id INT UNSIGNED NOT NULL,
  status      ENUM('ENROLLED', 'DROPPED', 'COMPLETED') NOT NULL DEFAULT 'ENROLLED',
  enrolled_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_enrollments PRIMARY KEY (student_id, offering_id),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id)
    REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_offering FOREIGN KEY (offering_id)
    REFERENCES course_offerings (offering_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX ix_enrollments_offering (offering_id, status)
) ENGINE = InnoDB;

CREATE TABLE syllabus_units (
  unit_id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  offering_id      INT UNSIGNED     NOT NULL,
  unit_no          TINYINT UNSIGNED NOT NULL,
  title            VARCHAR(200)     NOT NULL,
  topics           TEXT             NOT NULL,
  hours            TINYINT UNSIGNED NOT NULL,
  embedding_status ENUM('PENDING', 'SYNCED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  created_at       DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_syllabus_units PRIMARY KEY (unit_id),
  CONSTRAINT uq_syllabus_units_number UNIQUE (offering_id, unit_no),
  CONSTRAINT fk_syllabus_units_offering FOREIGN KEY (offering_id)
    REFERENCES course_offerings (offering_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_syllabus_units_number CHECK (unit_no BETWEEN 1 AND 12),
  CONSTRAINT ck_syllabus_units_hours CHECK (hours BETWEEN 1 AND 40),
  CONSTRAINT ck_syllabus_units_title CHECK (CHAR_LENGTH(TRIM(title)) >= 3),
  CONSTRAINT ck_syllabus_units_topics CHECK (CHAR_LENGTH(TRIM(topics)) >= 3)
) ENGINE = InnoDB;

CREATE TABLE exam_windows (
  exam_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  offering_id INT UNSIGNED NOT NULL,
  exam_type   ENUM('QUIZ', 'MID_SEM', 'END_SEM') NOT NULL,
  start_date  DATE         NOT NULL,
  end_date    DATE         NOT NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_exam_windows PRIMARY KEY (exam_id),
  CONSTRAINT uq_exam_windows_type UNIQUE (offering_id, exam_type),
  CONSTRAINT fk_exam_windows_offering FOREIGN KEY (offering_id)
    REFERENCES course_offerings (offering_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_exam_windows_dates CHECK (end_date >= start_date),
  INDEX ix_exam_windows_start (start_date)
) ENGINE = InnoDB;

CREATE TABLE holidays (
  holiday_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  holiday_date DATE         NOT NULL,
  name         VARCHAR(80)  NOT NULL,
  CONSTRAINT pk_holidays PRIMARY KEY (holiday_id),
  CONSTRAINT uq_holidays_date UNIQUE (holiday_date)
) ENGINE = InnoDB;

-- One typed row instead of key/value pairs, so every setting keeps its checks.
CREATE TABLE library_settings (
  setting_id            TINYINT UNSIGNED  NOT NULL DEFAULT 1,
  fine_per_day          DECIMAL(10, 2)    NOT NULL DEFAULT 5.00,
  fine_cap              DECIMAL(10, 2)    NOT NULL DEFAULT 200.00,
  lost_copy_fee         DECIMAL(10, 2)    NOT NULL DEFAULT 500.00,
  unpaid_fine_threshold DECIMAL(10, 2)    NOT NULL DEFAULT 100.00,
  hold_expiry_hours     SMALLINT UNSIGNED NOT NULL DEFAULT 48,
  busy_loan_days        TINYINT UNSIGNED  NOT NULL DEFAULT 7,
  waits_for_busy_loan   TINYINT UNSIGNED  NOT NULL DEFAULT 3,
  short_loan_days       TINYINT UNSIGNED  NOT NULL DEFAULT 3,
  shortage_threshold    DECIMAL(6, 2)     NOT NULL DEFAULT 20.00,
  weak_match_threshold  DECIMAL(4, 3)     NOT NULL DEFAULT 0.550,
  feature_flags         JSON              NOT NULL DEFAULT (JSON_OBJECT()),
  updated_at            DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_library_settings PRIMARY KEY (setting_id),
  CONSTRAINT ck_library_settings_singleton CHECK (setting_id = 1),
  CONSTRAINT ck_library_settings_fines CHECK (fine_per_day >= 0 AND fine_cap >= fine_per_day AND lost_copy_fee >= 0),
  CONSTRAINT ck_library_settings_threshold CHECK (unpaid_fine_threshold >= 0),
  CONSTRAINT ck_library_settings_hold_expiry CHECK (hold_expiry_hours BETWEEN 1 AND 336),
  CONSTRAINT ck_library_settings_loan_days CHECK (
    short_loan_days BETWEEN 1 AND busy_loan_days AND busy_loan_days BETWEEN 1 AND 30
  ),
  CONSTRAINT ck_library_settings_waits CHECK (waits_for_busy_loan BETWEEN 1 AND 50),
  CONSTRAINT ck_library_settings_shortage CHECK (shortage_threshold > 0),
  CONSTRAINT ck_library_settings_weak_match CHECK (weak_match_threshold BETWEEN 0 AND 1),
  CONSTRAINT ck_library_settings_flags CHECK (JSON_TYPE(feature_flags) = 'OBJECT')
) ENGINE = InnoDB;

INSERT INTO library_settings (setting_id) VALUES (1);

-- A coordinator must be an active faculty member of the department that owns
-- the course. Checked on insert and on any change of course or coordinator.
DELIMITER $$

CREATE TRIGGER trg_course_offerings_bi
BEFORE INSERT ON course_offerings
FOR EACH ROW
BEGIN
  IF NEW.coordinator_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      JOIN courses c ON c.course_id = NEW.course_id
     WHERE u.user_id = NEW.coordinator_id
       AND r.role_name = 'FACULTY'
       AND u.status = 'ACTIVE'
       AND u.dept_id = c.dept_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LS101: coordinator must be active faculty of the course department';
  END IF;
END$$

CREATE TRIGGER trg_course_offerings_bu
BEFORE UPDATE ON course_offerings
FOR EACH ROW
BEGIN
  IF NEW.coordinator_id IS NOT NULL
     AND (NEW.coordinator_id <> OLD.coordinator_id OR OLD.coordinator_id IS NULL OR NEW.course_id <> OLD.course_id)
     AND NOT EXISTS (
       SELECT 1
         FROM users u
         JOIN roles r ON r.role_id = u.role_id
         JOIN courses c ON c.course_id = NEW.course_id
        WHERE u.user_id = NEW.coordinator_id
          AND r.role_name = 'FACULTY'
          AND u.status = 'ACTIVE'
          AND u.dept_id = c.dept_id
     ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LS101: coordinator must be active faculty of the course department';
  END IF;
END$$

-- Only students can be enrolled, and only while their account is active.
CREATE TRIGGER trg_enrollments_bi
BEFORE INSERT ON enrollments
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = NEW.student_id
       AND r.role_name = 'STUDENT'
       AND u.status = 'ACTIVE'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LS102: only active students can be enrolled';
  END IF;
END$$

CREATE TRIGGER trg_enrollments_bu
BEFORE UPDATE ON enrollments
FOR EACH ROW
BEGIN
  IF NEW.student_id <> OLD.student_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LS103: an enrollment cannot move to another student';
  END IF;
END$$

DELIMITER ;
