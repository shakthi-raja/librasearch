-- Loan guards. The desk procedures validate first; these triggers are the second
-- line of defence for direct SQL, imports and future code paths. The update
-- trigger hands a returned copy to the allocator, which is safe to call twice.

DELIMITER $$

CREATE TRIGGER trg_loans_bi
BEFORE INSERT ON loans
FOR EACH ROW
BEGIN
  DECLARE v_book_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_copy_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_loan_policy VARCHAR(20) DEFAULT NULL;
  DECLARE v_book_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_member_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_member_role VARCHAR(20) DEFAULT NULL;
  DECLARE v_max_loans TINYINT UNSIGNED DEFAULT 0;
  DECLARE v_active_loans INT DEFAULT 0;
  DECLARE v_unpaid DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_threshold DECIMAL(10, 2) DEFAULT 0;
  DECLARE v_hold_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_hold_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_hold_copy INT UNSIGNED DEFAULT NULL;

  SELECT c.status, c.loan_policy, e.book_id, b.status
    INTO v_copy_status, v_loan_policy, v_book_id, v_book_status
    FROM copies c
    JOIN editions e ON e.edition_id = c.edition_id
    JOIN books b ON b.book_id = e.book_id
   WHERE c.copy_id = NEW.copy_id;

  IF v_copy_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS003: this copy is not on the shelf';
  END IF;
  IF v_book_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS008: this book is withdrawn';
  END IF;
  IF v_loan_policy = 'REFERENCE_ONLY' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS004: reference copies stay in the library';
  END IF;
  IF v_copy_status NOT IN ('AVAILABLE', 'ON_HOLD_SHELF') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS003: this copy is not on the shelf';
  END IF;

  SELECT hold_id, status, ready_copy_id
    INTO v_hold_id, v_hold_status, v_hold_copy
    FROM holds
   WHERE book_id = v_book_id
     AND member_id = NEW.member_id
     AND status IN ('WAITING', 'READY')
   ORDER BY placed_at, hold_id
   LIMIT 1;

  IF v_copy_status = 'ON_HOLD_SHELF' THEN
    IF v_hold_id IS NULL OR v_hold_status <> 'READY' OR v_hold_copy <> NEW.copy_id THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS007: this copy is reserved for another member';
    END IF;
  ELSEIF v_hold_status = 'READY' AND v_hold_copy <> NEW.copy_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS007: this member has a different reserved copy';
  END IF;

  SELECT u.status, r.role_name, r.max_loans
    INTO v_member_status, v_member_role, v_max_loans
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
   WHERE u.user_id = NEW.member_id;

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
   WHERE l.member_id = NEW.member_id
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
   WHERE member_id = NEW.member_id
     AND returned_at IS NULL
     AND end_reason IS NULL;

  IF v_active_loans >= v_max_loans THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS005: this member has reached the loan limit';
  END IF;
END$$

CREATE TRIGGER trg_loans_au
AFTER UPDATE ON loans
FOR EACH ROW
BEGIN
  IF NEW.end_reason = 'RETURNED'
     AND NEW.returned_at IS NOT NULL
     AND OLD.returned_at IS NULL THEN
    CALL sp_allocate_copy(NEW.copy_id);
  END IF;
END$$

DELIMITER ;
