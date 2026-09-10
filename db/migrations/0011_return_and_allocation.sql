-- Return and allocation. The copy is locked first, the open loan second. A
-- returned copy goes to the oldest waiting hold, or back on the shelf when
-- nobody is waiting. The allocator contains no transaction statements because
-- triggers and events call it from inside their own transaction.

DELIMITER $$

-- Days late times the daily rate, capped by policy. Money stays DECIMAL.
CREATE FUNCTION fn_fine_amount(p_loan_id INT UNSIGNED)
RETURNS DECIMAL(10, 2)
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_due DATETIME(3) DEFAULT NULL;
  DECLARE v_rate DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_cap DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_days INT DEFAULT 0;

  SELECT due_at INTO v_due FROM loans WHERE loan_id = p_loan_id;
  IF v_due IS NULL THEN
    RETURN 0;
  END IF;

  SELECT fine_per_day, fine_cap
    INTO v_rate, v_cap
    FROM library_settings
   WHERE setting_id = 1;

  SET v_days = GREATEST(DATEDIFF(NOW(3), v_due), 0);
  RETURN LEAST(v_days * v_rate, v_cap);
END$$

-- Puts a copy back into circulation: the oldest waiting hold gets it, otherwise
-- it becomes available. Calling it twice for the same copy is harmless.
CREATE PROCEDURE sp_allocate_copy(IN p_copy_id INT UNSIGNED)
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_book_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_hold_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_ready_hold INT UNSIGNED DEFAULT NULL;
  DECLARE v_hours SMALLINT UNSIGNED DEFAULT 48;

  SELECT e.book_id
    INTO v_book_id
    FROM copies c
    JOIN editions e ON e.edition_id = c.edition_id
   WHERE c.copy_id = p_copy_id;

  IF v_book_id IS NOT NULL THEN
    SELECT hold_id
      INTO v_ready_hold
      FROM holds
     WHERE ready_copy_id = p_copy_id
       AND status = 'READY'
     LIMIT 1;

    IF v_ready_hold IS NULL THEN
      SELECT hold_id
        INTO v_hold_id
        FROM holds
       WHERE book_id = v_book_id
         AND status = 'WAITING'
       ORDER BY placed_at
       LIMIT 1
         FOR UPDATE;

      IF v_hold_id IS NOT NULL THEN
        SELECT hold_expiry_hours INTO v_hours FROM library_settings WHERE setting_id = 1;
        UPDATE holds
           SET status = 'READY',
               ready_copy_id = p_copy_id,
               ready_at = NOW(3),
               pickup_by = DATE_ADD(NOW(3), INTERVAL v_hours HOUR)
         WHERE hold_id = v_hold_id;
        UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = p_copy_id;
      ELSE
        UPDATE copies
           SET status = 'AVAILABLE'
         WHERE copy_id = p_copy_id
           AND status NOT IN ('LOST', 'DAMAGED', 'WITHDRAWN');
      END IF;
    END IF;
  END IF;
END$$

CREATE PROCEDURE sp_return_copy(
  IN p_copy_barcode VARCHAR(20),
  IN p_actor_id INT UNSIGNED,
  OUT p_loan_id INT UNSIGNED,
  OUT p_fine_id INT UNSIGNED
)
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_copy_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_loan_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_due DATETIME(3) DEFAULT NULL;
  DECLARE v_days INT DEFAULT 0;
  DECLARE v_amount DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_fine_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_actor_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_actor_role VARCHAR(20) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_loan_id = NULL;
  SET p_fine_id = NULL;

  SELECT u.status, r.role_name
    INTO v_actor_status, v_actor_role
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = p_actor_id;

  IF v_actor_role IS NULL OR v_actor_role <> 'LIBRARIAN' OR v_actor_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS009: only a librarian can accept a return';
  END IF;

  START TRANSACTION;
  SET @app_user_id = p_actor_id;

  SELECT copy_id
    INTO v_copy_id
    FROM copies
   WHERE barcode = p_copy_barcode
     FOR UPDATE;

  IF v_copy_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS010: no open loan for that barcode';
  END IF;

  SELECT loan_id, due_at
    INTO v_loan_id, v_due
    FROM loans
   WHERE copy_id = v_copy_id
     AND returned_at IS NULL
     AND end_reason IS NULL
     FOR UPDATE;

  IF v_loan_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS010: no open loan for that barcode';
  END IF;

  SET v_days = GREATEST(DATEDIFF(NOW(3), v_due), 0);
  SET v_amount = fn_fine_amount(v_loan_id);

  SELECT fine_id
    INTO v_fine_id
    FROM fines
   WHERE loan_id = v_loan_id
     FOR UPDATE;

  IF v_fine_id IS NOT NULL THEN
    UPDATE fines
       SET amount = v_amount,
           days_overdue = v_days
     WHERE fine_id = v_fine_id
       AND status = 'UNPAID';
    SET p_fine_id = v_fine_id;
  ELSEIF v_amount > 0 THEN
    INSERT INTO fines (loan_id, amount, days_overdue)
    VALUES (v_loan_id, v_amount, v_days);
    SET p_fine_id = LAST_INSERT_ID();
  END IF;

  UPDATE loans
     SET returned_at = NOW(3),
         received_by = p_actor_id,
         end_reason = 'RETURNED',
         return_condition = 'GOOD'
   WHERE loan_id = v_loan_id;

  CALL sp_allocate_copy(v_copy_id);

  SET p_loan_id = v_loan_id;
  COMMIT;
END$$

DELIMITER ;

GRANT EXECUTE ON FUNCTION fn_fine_amount TO r_librarian;
GRANT EXECUTE ON PROCEDURE sp_allocate_copy TO r_librarian;
GRANT EXECUTE ON PROCEDURE sp_return_copy TO r_librarian;
