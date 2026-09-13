-- Circulation routines. The desk procedures own their transaction so a
-- validation failure always rolls the whole issue back. Business rules signal
-- LSnnn codes; the service layer maps them to readable messages.
--
-- Time is UTC everywhere: the server, the migration ledger and the application
-- pools all run with time_zone '+00:00'.

DELIMITER $$

-- The number of days a copy may leave the building. A short-loan copy wins over
-- demand; a book with enough waiting members gets the busy period; otherwise
-- the member's role decides. Holiday dates are skipped by the caller.
CREATE FUNCTION fn_loan_days(p_member_id INT UNSIGNED, p_copy_id INT UNSIGNED)
RETURNS TINYINT UNSIGNED
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_base TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_busy TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_short TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_waits TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_waiting INT DEFAULT 0;
  DECLARE v_policy VARCHAR(20) DEFAULT NULL;
  DECLARE v_book_id INT UNSIGNED DEFAULT NULL;

  SELECT r.loan_days, s.busy_loan_days, s.short_loan_days, s.waits_for_busy_loan
    INTO v_base, v_busy, v_short, v_waits
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    CROSS JOIN library_settings s
   WHERE u.user_id = p_member_id
     AND s.setting_id = 1;

  SELECT c.loan_policy, e.book_id
    INTO v_policy, v_book_id
    FROM copies c
    JOIN editions e ON e.edition_id = c.edition_id
   WHERE c.copy_id = p_copy_id;

  IF v_base = 0 OR v_book_id IS NULL THEN
    RETURN 0;
  END IF;

  IF v_policy = 'REFERENCE_ONLY' THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)
    INTO v_waiting
    FROM holds h
   WHERE h.book_id = v_book_id
     AND h.status = 'WAITING';

  IF v_policy = 'SHORT_LOAN' THEN
    RETURN v_short;
  END IF;
  IF v_waiting >= v_waits THEN
    RETURN v_busy;
  END IF;
  RETURN v_base;
END$$

-- Eligibility used by the desk and by the student-facing pages. The procedures
-- still signal a precise reason; this is the yes/no projection of the same
-- rules.
CREATE FUNCTION fn_can_borrow(p_member_id INT UNSIGNED)
RETURNS TINYINT(1)
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_role VARCHAR(20) DEFAULT NULL;
  DECLARE v_max TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_active INT DEFAULT 0;
  DECLARE v_unpaid DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_threshold DECIMAL(10, 2) DEFAULT 0;

  SELECT u.status, r.role_name, r.max_loans
    INTO v_status, v_role, v_max
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = p_member_id;

  IF v_status IS NULL OR v_status <> 'ACTIVE' OR v_role = 'LIBRARIAN' OR v_max = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)
    INTO v_active
    FROM loans
   WHERE member_id = p_member_id
     AND returned_at IS NULL
     AND end_reason IS NULL;

  IF v_active >= v_max THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(f.amount), 0)
    INTO v_unpaid
    FROM fines f
    JOIN loans l ON l.loan_id = f.loan_id
   WHERE l.member_id = p_member_id
     AND f.status = 'UNPAID';

  SELECT unpaid_fine_threshold
    INTO v_threshold
    FROM library_settings
   WHERE setting_id = 1;

  IF v_unpaid > v_threshold THEN
    RETURN 0;
  END IF;

  RETURN 1;
END$$

CREATE PROCEDURE sp_issue_copy(
  IN p_copy_barcode VARCHAR(20),
  IN p_member_id INT UNSIGNED,
  IN p_actor_id INT UNSIGNED,
  OUT p_loan_id INT UNSIGNED
)
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_copy_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_book_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_copy_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_loan_policy VARCHAR(20) DEFAULT NULL;
  DECLARE v_book_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_actor_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_actor_role VARCHAR(20) DEFAULT NULL;
  DECLARE v_member_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_member_role VARCHAR(20) DEFAULT NULL;
  DECLARE v_max_loans TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_active_loans INT DEFAULT 0;
  DECLARE v_unpaid DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_threshold DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_hold_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_hold_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_hold_copy INT UNSIGNED DEFAULT NULL;
  DECLARE v_days TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_due DATETIME(3) DEFAULT NULL;
  DECLARE v_rule VARCHAR(20) DEFAULT 'STANDARD';
  DECLARE v_waiting INT DEFAULT 0;
  DECLARE v_waits TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_holiday INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_loan_id = NULL;

  SELECT u.status, r.role_name
    INTO v_actor_status, v_actor_role
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = p_actor_id;

  IF v_actor_role IS NULL OR v_actor_role <> 'LIBRARIAN' OR v_actor_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS009: only a librarian can issue a copy';
  END IF;

  START TRANSACTION;
  SET @app_user_id = p_actor_id;

  SELECT c.copy_id, c.status, c.loan_policy, e.book_id, b.status
    INTO v_copy_id, v_copy_status, v_loan_policy, v_book_id, v_book_status
    FROM copies c
    JOIN editions e ON e.edition_id = c.edition_id
    JOIN books b ON b.book_id = e.book_id
   WHERE c.barcode = p_copy_barcode
     FOR UPDATE;

  IF v_copy_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS002: no copy has that barcode';
  END IF;
  IF v_book_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS008: this book is withdrawn';
  END IF;
  IF v_loan_policy = 'REFERENCE_ONLY' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS004: reference copies stay in the library';
  END IF;
  IF v_copy_status <> 'AVAILABLE' AND v_copy_status <> 'ON_HOLD_SHELF' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS003: this copy is not on the shelf';
  END IF;

  SELECT u.status, r.role_name, r.max_loans
    INTO v_member_status, v_member_role, v_max_loans
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = p_member_id
     FOR UPDATE;

  IF v_member_status IS NULL
     OR v_member_status <> 'ACTIVE'
     OR v_member_role = 'LIBRARIAN'
     OR v_max_loans = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS001: this member cannot borrow';
  END IF;

  SELECT COALESCE(SUM(f.amount), 0)
    INTO v_unpaid
    FROM fines f
    JOIN loans l ON l.loan_id = f.loan_id
   WHERE l.member_id = p_member_id
     AND f.status = 'UNPAID';

  SELECT unpaid_fine_threshold
    INTO v_threshold
    FROM library_settings
   WHERE setting_id = 1;

  IF v_unpaid > v_threshold THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS006: unpaid fines above the limit';
  END IF;

  SELECT COUNT(*)
    INTO v_active_loans
    FROM loans
   WHERE member_id = p_member_id
     AND returned_at IS NULL
     AND end_reason IS NULL;

  IF v_active_loans >= v_max_loans THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS005: this member has reached the loan limit';
  END IF;

  SELECT hold_id, status, ready_copy_id
    INTO v_hold_id, v_hold_status, v_hold_copy
    FROM holds
   WHERE book_id = v_book_id
     AND member_id = p_member_id
     AND status IN ('WAITING', 'READY')
   ORDER BY placed_at
   LIMIT 1
     FOR UPDATE;

  IF v_copy_status = 'ON_HOLD_SHELF' THEN
    IF v_hold_id IS NULL OR v_hold_status <> 'READY' OR v_hold_copy <> v_copy_id THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS007: this copy is reserved for another member';
    END IF;
  ELSEIF v_hold_status = 'READY' AND v_hold_copy <> v_copy_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS007: this member has a different reserved copy';
  END IF;

  SET v_days = fn_loan_days(p_member_id, v_copy_id);
  IF v_days = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS001: this member cannot borrow';
  END IF;

  SET v_due = DATE_ADD(NOW(3), INTERVAL v_days DAY);
  SET v_holiday = 1;
  WHILE v_holiday > 0 DO
    SELECT COUNT(*) INTO v_holiday FROM holidays WHERE holiday_date = DATE(v_due);
    IF v_holiday > 0 THEN
      SET v_due = DATE_ADD(v_due, INTERVAL 1 DAY);
    END IF;
  END WHILE;

  IF v_loan_policy = 'SHORT_LOAN' THEN
    SET v_rule = 'SHORT_LOAN';
  ELSE
    SELECT COUNT(*) INTO v_waiting FROM holds WHERE book_id = v_book_id AND status = 'WAITING';
    SELECT waits_for_busy_loan INTO v_waits FROM library_settings WHERE setting_id = 1;
    IF v_waiting >= v_waits THEN
      SET v_rule = 'HIGH_DEMAND';
    ELSE
      SET v_rule = 'STANDARD';
    END IF;
  END IF;

  INSERT INTO loans (copy_id, member_id, issued_by, due_at, period_rule)
  VALUES (v_copy_id, p_member_id, p_actor_id, v_due, v_rule);
  SET p_loan_id = LAST_INSERT_ID();

  IF v_hold_id IS NOT NULL THEN
    UPDATE holds
       SET status = 'FULFILLED',
           closed_at = NOW(3),
           close_reason = 'Issued at the desk'
     WHERE hold_id = v_hold_id;
  END IF;

  UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = v_copy_id;

  COMMIT;
END$$

DELIMITER ;

GRANT EXECUTE ON FUNCTION fn_loan_days TO r_librarian;
GRANT EXECUTE ON FUNCTION fn_can_borrow TO r_librarian;
GRANT EXECUTE ON PROCEDURE sp_issue_copy TO r_librarian;
