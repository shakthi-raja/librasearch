-- Circulation, procurement and system tables.
--
-- The rules that matter under concurrency are enforced by unique indexes on
-- stored generated columns: a column that holds the key only while the row is
-- "live" and NULL otherwise. NULLs never collide, so closed rows pile up
-- freely while live ones stay unique.
--
-- MySQL forbids CASCADE and SET NULL on a foreign key column that a stored
-- generated column or a check constraint depends on, so those keys are
-- RESTRICT in both directions. Primary keys never change, so nothing is lost.

CREATE TABLE loans (
  loan_id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  copy_id          INT UNSIGNED     NOT NULL,
  member_id        INT UNSIGNED     NOT NULL,
  issued_by        INT UNSIGNED     NOT NULL,
  issued_at        DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  due_at           DATETIME(3)      NOT NULL,
  period_rule      ENUM('STANDARD', 'HIGH_DEMAND', 'SHORT_LOAN') NOT NULL DEFAULT 'STANDARD',
  renew_count      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  returned_at      DATETIME(3)      NULL,
  received_by      INT UNSIGNED     NULL,
  end_reason       ENUM('RETURNED', 'LOST', 'WRITTEN_OFF') NULL,
  return_condition ENUM('GOOD', 'WORN', 'DAMAGED') NULL,
  notes            VARCHAR(300)     NULL,
  active_copy_id   INT UNSIGNED GENERATED ALWAYS AS (
    IF(returned_at IS NULL AND end_reason IS NULL, copy_id, NULL)
  ) STORED,
  CONSTRAINT pk_loans PRIMARY KEY (loan_id),
  CONSTRAINT uq_loans_one_open_per_copy UNIQUE (active_copy_id),
  CONSTRAINT fk_loans_copy FOREIGN KEY (copy_id)
    REFERENCES copies (copy_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_loans_member FOREIGN KEY (member_id)
    REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_loans_issued_by FOREIGN KEY (issued_by)
    REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_loans_received_by FOREIGN KEY (received_by)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_loans_due CHECK (due_at > issued_at),
  CONSTRAINT ck_loans_returned CHECK (returned_at IS NULL OR returned_at >= issued_at),
  CONSTRAINT ck_loans_closed CHECK ((returned_at IS NULL) = (end_reason IS NULL)),
  CONSTRAINT ck_loans_condition CHECK (return_condition IS NULL OR end_reason = 'RETURNED'),
  CONSTRAINT ck_loans_renewals CHECK (renew_count <= 5),
  CONSTRAINT ck_loans_not_self_issued CHECK (issued_by <> member_id),
  INDEX ix_loans_member_open (member_id, returned_at),
  INDEX ix_loans_due (due_at),
  INDEX ix_loans_copy (copy_id, issued_at)
) ENGINE = InnoDB;

CREATE TABLE holds (
  hold_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  book_id          INT UNSIGNED NOT NULL,
  member_id        INT UNSIGNED NOT NULL,
  placed_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  status           ENUM('WAITING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'WAITING',
  ready_copy_id    INT UNSIGNED NULL,
  ready_at         DATETIME(3)  NULL,
  pickup_by        DATETIME(3)  NULL,
  closed_at        DATETIME(3)  NULL,
  close_reason     VARCHAR(200) NULL,
  active_member_id INT UNSIGNED GENERATED ALWAYS AS (
    IF(status IN ('WAITING', 'READY'), member_id, NULL)
  ) STORED,
  active_ready_copy_id INT UNSIGNED GENERATED ALWAYS AS (
    IF(status = 'READY', ready_copy_id, NULL)
  ) STORED,
  CONSTRAINT pk_holds PRIMARY KEY (hold_id),
  CONSTRAINT uq_holds_one_active_per_member UNIQUE (book_id, active_member_id),
  CONSTRAINT uq_holds_one_ready_per_copy UNIQUE (active_ready_copy_id),
  CONSTRAINT fk_holds_book FOREIGN KEY (book_id)
    REFERENCES books (book_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_holds_member FOREIGN KEY (member_id)
    REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_holds_ready_copy FOREIGN KEY (ready_copy_id)
    REFERENCES copies (copy_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_holds_ready CHECK (
    status <> 'READY' OR (ready_copy_id IS NOT NULL AND ready_at IS NOT NULL AND pickup_by IS NOT NULL)
  ),
  CONSTRAINT ck_holds_pickup CHECK (pickup_by IS NULL OR pickup_by > ready_at),
  CONSTRAINT ck_holds_closed CHECK ((status IN ('WAITING', 'READY')) = (closed_at IS NULL)),
  INDEX ix_holds_queue (book_id, status, placed_at),
  INDEX ix_holds_member (member_id, status)
) ENGINE = InnoDB;

CREATE TABLE fines (
  fine_id       INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  loan_id       INT UNSIGNED      NOT NULL,
  amount        DECIMAL(10, 2)    NOT NULL,
  days_overdue  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  reason        ENUM('OVERDUE', 'LOST', 'DAMAGE') NOT NULL DEFAULT 'OVERDUE',
  status        ENUM('UNPAID', 'PAID', 'WAIVED') NOT NULL DEFAULT 'UNPAID',
  created_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  settled_at    DATETIME(3)       NULL,
  settled_by    INT UNSIGNED      NULL,
  waiver_reason VARCHAR(300)      NULL,
  CONSTRAINT pk_fines PRIMARY KEY (fine_id),
  CONSTRAINT uq_fines_loan UNIQUE (loan_id),
  CONSTRAINT fk_fines_loan FOREIGN KEY (loan_id)
    REFERENCES loans (loan_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_fines_settled_by FOREIGN KEY (settled_by)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_fines_amount CHECK (amount >= 0),
  CONSTRAINT ck_fines_settled CHECK ((status = 'UNPAID') = (settled_at IS NULL)),
  CONSTRAINT ck_fines_waiver CHECK (status <> 'WAIVED' OR CHAR_LENGTH(TRIM(waiver_reason)) >= 5),
  INDEX ix_fines_status (status, created_at)
) ENGINE = InnoDB;

-- One row per copy whose lending rule an exam window changed, so reverting
-- restores exactly what was there before.
CREATE TABLE policy_overrides (
  override_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  book_id         INT UNSIGNED NOT NULL,
  copy_id         INT UNSIGNED NOT NULL,
  exam_id         INT UNSIGNED NOT NULL,
  previous_policy ENUM('REGULAR', 'SHORT_LOAN', 'REFERENCE_ONLY') NOT NULL,
  applied_policy  ENUM('REGULAR', 'SHORT_LOAN', 'REFERENCE_ONLY') NOT NULL,
  starts_on       DATE         NOT NULL,
  ends_on         DATE         NOT NULL,
  applied_by      INT UNSIGNED NOT NULL,
  applied_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reverted_at     DATETIME(3)  NULL,
  active_copy_id  INT UNSIGNED GENERATED ALWAYS AS (IF(reverted_at IS NULL, copy_id, NULL)) STORED,
  CONSTRAINT pk_policy_overrides PRIMARY KEY (override_id),
  CONSTRAINT uq_policy_overrides_one_active_per_copy UNIQUE (active_copy_id),
  CONSTRAINT fk_policy_overrides_book FOREIGN KEY (book_id)
    REFERENCES books (book_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_policy_overrides_copy FOREIGN KEY (copy_id)
    REFERENCES copies (copy_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_policy_overrides_exam FOREIGN KEY (exam_id)
    REFERENCES exam_windows (exam_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_policy_overrides_applied_by FOREIGN KEY (applied_by)
    REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_policy_overrides_dates CHECK (ends_on >= starts_on),
  CONSTRAINT ck_policy_overrides_change CHECK (applied_policy <> previous_policy),
  INDEX ix_policy_overrides_exam (exam_id),
  INDEX ix_policy_overrides_open (reverted_at, ends_on)
) ENGINE = InnoDB;

CREATE TABLE purchase_requests (
  request_id   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  requested_by INT UNSIGNED     NOT NULL,
  unit_id      INT UNSIGNED     NULL,
  title        VARCHAR(200)     NOT NULL,
  author       VARCHAR(160)     NULL,
  isbn13       CHAR(13)         NULL,
  reason       TEXT             NOT NULL,
  quantity     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status       ENUM('PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED') NOT NULL DEFAULT 'PENDING',
  reviewed_by  INT UNSIGNED     NULL,
  reviewed_at  DATETIME(3)      NULL,
  review_note  VARCHAR(300)     NULL,
  vendor       VARCHAR(120)     NULL,
  expected_on  DATE             NULL,
  received_at  DATETIME(3)      NULL,
  created_at   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_purchase_requests PRIMARY KEY (request_id),
  CONSTRAINT fk_purchase_requests_requested_by FOREIGN KEY (requested_by)
    REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_requests_unit FOREIGN KEY (unit_id)
    REFERENCES syllabus_units (unit_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_requests_reviewed_by FOREIGN KEY (reviewed_by)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_purchase_requests_quantity CHECK (quantity BETWEEN 1 AND 50),
  CONSTRAINT ck_purchase_requests_isbn CHECK (isbn13 IS NULL OR REGEXP_LIKE(isbn13, '^97[89][0-9]{10}$')),
  CONSTRAINT ck_purchase_requests_reviewed CHECK (status = 'PENDING' OR reviewed_at IS NOT NULL),
  CONSTRAINT ck_purchase_requests_ordered CHECK (status NOT IN ('ORDERED', 'RECEIVED') OR vendor IS NOT NULL),
  CONSTRAINT ck_purchase_requests_received CHECK ((status = 'RECEIVED') = (received_at IS NOT NULL)),
  INDEX ix_purchase_requests_status (status, created_at),
  INDEX ix_purchase_requests_requester (requested_by, created_at)
) ENGINE = InnoDB;

CREATE TABLE notifications (
  notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED    NOT NULL,
  type            ENUM('HOLD_READY', 'DUE_SOON', 'OVERDUE', 'FINE', 'REQUEST', 'SYSTEM') NOT NULL,
  title           VARCHAR(120)    NOT NULL,
  body            VARCHAR(500)    NOT NULL,
  link            VARCHAR(300)    NULL,
  read_at         DATETIME(3)     NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_notifications PRIMARY KEY (notification_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_notifications_link CHECK (link IS NULL OR link LIKE '/%'),
  INDEX ix_notifications_unread (user_id, read_at, created_at)
) ENGINE = InnoDB;

CREATE TABLE unit_chapter_map (
  unit_id     INT UNSIGNED  NOT NULL,
  chapter_id  INT UNSIGNED  NOT NULL,
  similarity  DECIMAL(5, 4) NULL,
  source      ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'AUTO',
  status      ENUM('SUGGESTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUGGESTED',
  reviewed_by INT UNSIGNED  NULL,
  reviewed_at DATETIME(3)   NULL,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_unit_chapter_map PRIMARY KEY (unit_id, chapter_id),
  CONSTRAINT fk_unit_chapter_map_unit FOREIGN KEY (unit_id)
    REFERENCES syllabus_units (unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_unit_chapter_map_chapter FOREIGN KEY (chapter_id)
    REFERENCES chapters (chapter_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_unit_chapter_map_reviewed_by FOREIGN KEY (reviewed_by)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_unit_chapter_map_similarity CHECK (similarity IS NULL OR similarity BETWEEN 0 AND 1),
  CONSTRAINT ck_unit_chapter_map_auto CHECK (source <> 'AUTO' OR similarity IS NOT NULL),
  CONSTRAINT ck_unit_chapter_map_reviewed CHECK (status = 'SUGGESTED' OR reviewed_at IS NOT NULL),
  INDEX ix_unit_chapter_map_chapter (chapter_id, status)
) ENGINE = InnoDB;

-- Written in the same transaction as the catalogue change it describes; the
-- worker drains it into Qdrant.
CREATE TABLE embedding_outbox (
  job_id       BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  entity_type  ENUM('BOOK', 'EDITION', 'CHAPTER', 'UNIT') NOT NULL,
  entity_id    INT UNSIGNED     NOT NULL,
  operation    ENUM('UPSERT', 'PAYLOAD', 'DELETE') NOT NULL,
  status       ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED') NOT NULL DEFAULT 'PENDING',
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_error   VARCHAR(1000)    NULL,
  available_at DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at DATETIME(3)      NULL,
  CONSTRAINT pk_embedding_outbox PRIMARY KEY (job_id),
  CONSTRAINT ck_embedding_outbox_attempts CHECK (attempts <= 10),
  CONSTRAINT ck_embedding_outbox_done CHECK ((status IN ('DONE', 'FAILED')) = (processed_at IS NOT NULL)),
  INDEX ix_embedding_outbox_poll (status, available_at, job_id),
  INDEX ix_embedding_outbox_entity (entity_type, entity_id)
) ENGINE = InnoDB;

CREATE TABLE search_log (
  search_id       BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED      NULL,
  query_text      VARCHAR(500)      NOT NULL,
  mode            ENUM('KEYWORD', 'SEMANTIC', 'HYBRID') NOT NULL,
  filters         JSON              NULL,
  result_count    SMALLINT UNSIGNED NOT NULL,
  top_score       DECIMAL(8, 4)     NULL,
  latency_ms      INT UNSIGNED      NOT NULL,
  -- no foreign key: the log must outlive the book it points at
  clicked_book_id INT UNSIGNED      NULL,
  clicked_at      DATETIME(3)       NULL,
  created_at      DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_search_log PRIMARY KEY (search_id),
  CONSTRAINT fk_search_log_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_search_log_filters CHECK (filters IS NULL OR JSON_TYPE(filters) = 'OBJECT'),
  CONSTRAINT ck_search_log_click CHECK ((clicked_book_id IS NULL) = (clicked_at IS NULL)),
  INDEX ix_search_log_created (created_at),
  INDEX ix_search_log_mode (mode, created_at)
) ENGINE = InnoDB;

-- Who changed what. Deliberately without foreign keys so history survives the
-- rows it describes.
CREATE TABLE audit_log (
  audit_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(64)     NOT NULL,
  record_id  VARCHAR(64)     NOT NULL,
  action     ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  changed_by INT UNSIGNED    NULL,
  old_data   JSON            NULL,
  new_data   JSON            NULL,
  ip         VARCHAR(45)     NULL,
  changed_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_audit_log PRIMARY KEY (audit_id),
  CONSTRAINT ck_audit_log_payload CHECK (old_data IS NOT NULL OR new_data IS NOT NULL),
  INDEX ix_audit_log_record (table_name, record_id, changed_at),
  INDEX ix_audit_log_changed (changed_at, audit_id),
  INDEX ix_audit_log_actor (changed_by, changed_at)
) ENGINE = InnoDB;
