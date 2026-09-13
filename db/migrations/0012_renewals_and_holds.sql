-- Renewals and holds. Each procedure validates in the database, signals an
-- LSnnn code and rolls back on failure, so the service layer never decides a
-- rule on its own. Holds are queued by placed_at; cancelling a ready hold gives
-- the copy to the next waiter or puts it back on the shelf.

DELIMITER $$

CREATE PROCEDURE sp_renew_loan(
  IN p_loan_id INT UNSIGNED,
  IN p_actor_id INT UNSIGNED,
  OUT p_due_at DATETIME(3)
)
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_member_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_copy_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_book_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_due DATETIME(3) DEFAULT NULL;
  DECLARE v_renew_count TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_max_renewals TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_member_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_actor_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_actor_role VARCHAR(20) DEFAULT NULL;
  DECLARE v_member_role VARCHAR(20) DEFAULT NULL;
  DECLARE v_waiting INT DEFAULT 0;
  DECLARE v_days TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_holiday INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_due_at = NULL;
  START TRANSACTION;
  SET @app_user_id = p_actor_id;

  SELECT l.member_id, l.copy_id, l.due_at, l.renew_count, e.book_id
    INTO v_member_id, v_copy_id, v_due, v_renew_count, v_book_id
    FROM loans l
    JOIN copies c ON c.copy_id = l.copy_id
    JOIN editions e ON e.edition_id = c.edition_id
   WHERE l.loan_id = p_loan_id
     AND l.returned_at IS NULL
     AND l.end_reason IS NULL
     FOR UPDATE;

  IF v_member_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS010: no open loan to renew';
  END IF;

  SELECT u.status, r.role_name, r.max_renewals
    INTO v_member_status, v_member_role, v_max_renewals
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = v_member_id;

  SELECT u.status, r.role_name
    INTO v_actor_status, v_actor_role
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = p_actor_id;

  IF v_actor_role IS NULL
     OR (v_actor_role <> 'LIBRARIAN' AND p_actor_id <> v_member_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS014: only the borrower or a librarian can renew';
  END IF;
  IF v_actor_role = 'LIBRARIAN' AND v_actor_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS014: only the borrower or a librarian can renew';
  END IF;
  IF v_member_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS001: this member cannot borrow';
  END IF;
  IF v_due < NOW(3) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS013: overdue loans cannot be renewed';
  END IF;
  IF v_renew_count >= v_max_renewals THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS011: this loan has reached its renewal limit';
  END IF;

  SELECT COUNT(*)
    INTO v_waiting
    FROM holds
   WHERE book_id = v_book_id
     AND status IN ('WAITING', 'READY');

  IF v_waiting > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS012: another member is waiting for this book';
  END IF;

  SET v_days = fn_loan_days(v_member_id, v_copy_id);
  IF v_days = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS001: this member cannot borrow';
  END IF;

  SET v_due = DATE_ADD(v_due, INTERVAL v_days DAY);
  SET v_holiday = 1;
  WHILE v_holiday > 0 DO
    SELECT COUNT(*) INTO v_holiday FROM holidays WHERE holiday_date = DATE(v_due);
    IF v_holiday > 0 THEN
      SET v_due = DATE_ADD(v_due, INTERVAL 1 DAY);
    END IF;
  END WHILE;

  UPDATE loans
     SET due_at = v_due,
         renew_count = renew_count + 1
   WHERE loan_id = p_loan_id;

  SET p_due_at = v_due;
  COMMIT;
END$$

CREATE PROCEDURE sp_place_hold(
  IN p_book_id INT UNSIGNED,
  IN p_member_id INT UNSIGNED,
  OUT p_hold_id INT UNSIGNED
)
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_member_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_member_role VARCHAR(20) DEFAULT NULL;
  DECLARE v_book_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_existing INT UNSIGNED DEFAULT NULL;
  DECLARE v_available INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_hold_id = NULL;
  START TRANSACTION;
  SET @app_user_id = p_member_id;

  SELECT u.status, r.role_name
    INTO v_member_status, v_member_role
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = p_member_id
     FOR UPDATE;

  IF v_member_status IS NULL
     OR v_member_status <> 'ACTIVE'
     OR v_member_role = 'LIBRARIAN' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS001: this member cannot place a hold';
  END IF;

  SELECT status INTO v_book_status FROM books WHERE book_id = p_book_id;
  IF v_book_status IS NULL OR v_book_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS008: this book is withdrawn';
  END IF;

  SELECT hold_id
    INTO v_existing
    FROM holds
   WHERE book_id = p_book_id
     AND member_id = p_member_id
     AND status IN ('WAITING', 'READY')
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS015: this member already has an active hold';
  END IF;

  SET v_available = fn_available_copies(p_book_id);
  IF v_available > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS016: a copy is on the shelf, no hold is needed';
  END IF;

  INSERT INTO holds (book_id, member_id) VALUES (p_book_id, p_member_id);
  SET p_hold_id = LAST_INSERT_ID();
  COMMIT;
END$$

CREATE PROCEDURE sp_cancel_hold(
  IN p_hold_id INT UNSIGNED,
  IN p_actor_id INT UNSIGNED
)
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_member_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_ready_copy INT UNSIGNED DEFAULT NULL;
  DECLARE v_actor_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_actor_role VARCHAR(20) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SET @app_user_id = p_actor_id;

  SELECT h.member_id, h.status, h.ready_copy_id
    INTO v_member_id, v_status, v_ready_copy
    FROM holds h
   WHERE h.hold_id = p_hold_id
     FOR UPDATE;

  IF v_member_id IS NULL OR v_status NOT IN ('WAITING', 'READY') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS017: hold not found or already closed';
  END IF;

  SELECT u.status, r.role_name
    INTO v_actor_status, v_actor_role
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = p_actor_id;

  IF v_actor_role IS NULL
     OR (v_actor_role <> 'LIBRARIAN' AND p_actor_id <> v_member_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS018: only the holder or a librarian can cancel this hold';
  END IF;
  IF v_actor_role = 'LIBRARIAN' AND v_actor_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS018: only the holder or a librarian can cancel this hold';
  END IF;

  UPDATE holds
     SET status = 'CANCELLED',
         closed_at = NOW(3),
         close_reason = 'Cancelled at the desk'
   WHERE hold_id = p_hold_id;

  IF v_status = 'READY' AND v_ready_copy IS NOT NULL THEN
    CALL sp_allocate_copy(v_ready_copy);
  END IF;

  COMMIT;
END$$

DELIMITER ;

GRANT EXECUTE ON PROCEDURE sp_renew_loan TO r_student;
GRANT EXECUTE ON PROCEDURE sp_renew_loan TO r_faculty;
GRANT EXECUTE ON PROCEDURE sp_renew_loan TO r_librarian;
GRANT EXECUTE ON PROCEDURE sp_place_hold TO r_student;
GRANT EXECUTE ON PROCEDURE sp_place_hold TO r_faculty;
GRANT EXECUTE ON PROCEDURE sp_cancel_hold TO r_student;
GRANT EXECUTE ON PROCEDURE sp_cancel_hold TO r_faculty;
GRANT EXECUTE ON PROCEDURE sp_cancel_hold TO r_librarian;
