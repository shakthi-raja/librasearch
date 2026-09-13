-- Scheduled jobs. The procedures are callable by hand (and by the tests); the
-- events run them on the server. The first run is one interval away so applying
-- migrations never changes data immediately.

DELIMITER $$

CREATE PROCEDURE sp_expire_holds()
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_hold_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_copy_id INT UNSIGNED DEFAULT NULL;
  DECLARE expired CURSOR FOR
    SELECT hold_id, ready_copy_id
      FROM holds
     WHERE status = 'READY'
       AND pickup_by IS NOT NULL
       AND pickup_by < NOW(3);
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SET @app_user_id = NULL;

  OPEN expired;
  read_expired: LOOP
    FETCH expired INTO v_hold_id, v_copy_id;
    IF v_done = 1 THEN
      LEAVE read_expired;
    END IF;

    UPDATE holds
       SET status = 'EXPIRED',
           closed_at = NOW(3),
           close_reason = 'Pickup deadline passed'
     WHERE hold_id = v_hold_id;

    IF v_copy_id IS NOT NULL THEN
      CALL sp_allocate_copy(v_copy_id);
    END IF;
  END LOOP;
  CLOSE expired;

  COMMIT;
END$$

CREATE PROCEDURE sp_accrue_fines()
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SET @app_user_id = NULL;

  INSERT INTO fines (loan_id, amount, days_overdue)
  SELECT l.loan_id,
         LEAST(GREATEST(DATEDIFF(NOW(3), l.due_at), 0) * s.fine_per_day, s.fine_cap),
         GREATEST(DATEDIFF(NOW(3), l.due_at), 0)
    FROM loans l
    CROSS JOIN library_settings s
   WHERE l.returned_at IS NULL
     AND l.end_reason IS NULL
     AND l.due_at < NOW(3)
     AND s.setting_id = 1
     AND NOT EXISTS (SELECT 1 FROM fines f WHERE f.loan_id = l.loan_id);

  UPDATE fines f
    JOIN loans l ON l.loan_id = f.loan_id
    CROSS JOIN library_settings s
     SET f.amount = LEAST(GREATEST(DATEDIFF(NOW(3), l.due_at), 0) * s.fine_per_day, s.fine_cap),
         f.days_overdue = GREATEST(DATEDIFF(NOW(3), l.due_at), 0)
   WHERE f.status = 'UNPAID'
     AND l.returned_at IS NULL
     AND l.end_reason IS NULL
     AND l.due_at < NOW(3)
     AND s.setting_id = 1;

  COMMIT;
END$$

CREATE PROCEDURE sp_send_due_notices()
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO notifications (user_id, type, title, body, link)
  SELECT l.member_id,
         'DUE_SOON',
         'A loan is due soon',
         CONCAT('Due on ', DATE_FORMAT(l.due_at, '%d %b %Y'), '.'),
         CONCAT('/student/loans/', l.loan_id)
    FROM loans l
   WHERE l.returned_at IS NULL
     AND l.end_reason IS NULL
     AND l.due_at >= NOW(3)
     AND l.due_at < DATE_ADD(NOW(3), INTERVAL 2 DAY)
     AND NOT EXISTS (
       SELECT 1
         FROM notifications n
        WHERE n.user_id = l.member_id
          AND n.type = 'DUE_SOON'
          AND n.link = CONCAT('/student/loans/', l.loan_id)
          AND n.created_at >= DATE_SUB(NOW(3), INTERVAL 1 DAY)
     );

  INSERT INTO notifications (user_id, type, title, body, link)
  SELECT l.member_id,
         'OVERDUE',
         'A loan is overdue',
         CONCAT('Due on ', DATE_FORMAT(l.due_at, '%d %b %Y'), '. Please return it.'),
         CONCAT('/student/loans/', l.loan_id)
    FROM loans l
   WHERE l.returned_at IS NULL
     AND l.end_reason IS NULL
     AND l.due_at < NOW(3)
     AND NOT EXISTS (
       SELECT 1
         FROM notifications n
        WHERE n.user_id = l.member_id
          AND n.type = 'OVERDUE'
          AND n.link = CONCAT('/student/loans/', l.loan_id)
          AND n.created_at >= DATE_SUB(NOW(3), INTERVAL 1 DAY)
     );

  COMMIT;
END$$

DELIMITER ;

CREATE EVENT ev_expire_holds
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
DO CALL sp_expire_holds();

CREATE EVENT ev_accrue_fines
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 26 HOUR
DO CALL sp_accrue_fines();

CREATE EVENT ev_due_notifications
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 31 HOUR
DO CALL sp_send_due_notices();

GRANT EXECUTE ON PROCEDURE sp_expire_holds TO r_librarian;
GRANT EXECUTE ON PROCEDURE sp_accrue_fines TO r_librarian;
GRANT EXECUTE ON PROCEDURE sp_send_due_notices TO r_librarian;
