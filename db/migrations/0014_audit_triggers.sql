-- Audit trails for the changes that matter in a viva: a role or account
-- status, a copy's shelf state or lending rule, and a fine's amount or
-- settlement. The actor is the application user id the connection set for the
-- statement; audit rows survive deletion of the rows they describe.

DELIMITER $$

CREATE TRIGGER trg_users_au
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF NOT (OLD.role_id <=> NEW.role_id)
     OR NOT (OLD.status <=> NEW.status) THEN
    INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (
      'users',
      NEW.user_id,
      'UPDATE',
      @app_user_id,
      JSON_OBJECT('role_id', OLD.role_id, 'status', OLD.status),
      JSON_OBJECT('role_id', NEW.role_id, 'status', NEW.status)
    );
  END IF;
END$$

CREATE TRIGGER trg_copies_au
AFTER UPDATE ON copies
FOR EACH ROW
BEGIN
  IF NOT (OLD.status <=> NEW.status)
     OR NOT (OLD.loan_policy <=> NEW.loan_policy) THEN
    INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (
      'copies',
      NEW.copy_id,
      'UPDATE',
      @app_user_id,
      JSON_OBJECT('status', OLD.status, 'loan_policy', OLD.loan_policy),
      JSON_OBJECT('status', NEW.status, 'loan_policy', NEW.loan_policy)
    );
  END IF;
END$$

CREATE TRIGGER trg_fines_au
AFTER UPDATE ON fines
FOR EACH ROW
BEGIN
  IF NOT (OLD.status <=> NEW.status)
     OR NOT (OLD.amount <=> NEW.amount)
     OR NOT (OLD.days_overdue <=> NEW.days_overdue) THEN
    INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (
      'fines',
      NEW.fine_id,
      'UPDATE',
      @app_user_id,
      JSON_OBJECT(
        'status', OLD.status,
        'amount', OLD.amount,
        'days_overdue', OLD.days_overdue,
        'settled_at', OLD.settled_at,
        'settled_by', OLD.settled_by,
        'waiver_reason', OLD.waiver_reason
      ),
      JSON_OBJECT(
        'status', NEW.status,
        'amount', NEW.amount,
        'days_overdue', NEW.days_overdue,
        'settled_at', NEW.settled_at,
        'settled_by', NEW.settled_by,
        'waiver_reason', NEW.waiver_reason
      )
    );
  END IF;
END$$

DELIMITER ;
