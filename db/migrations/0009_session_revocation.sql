-- Sessions end in the database the moment the account they belong to changes
-- role, stops being active or changes password. The app cannot forget to do
-- it, and a librarian suspending someone takes effect on their next request.

DELIMITER $$

CREATE TRIGGER trg_users_au_revoke_sessions
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.role_id <> OLD.role_id
     OR (NEW.status <> OLD.status AND NEW.status <> 'ACTIVE')
     OR NEW.password_changed_at <> OLD.password_changed_at THEN
    UPDATE auth_sessions
       SET revoked_at = CURRENT_TIMESTAMP(3)
     WHERE user_id = NEW.user_id
       AND revoked_at IS NULL;
  END IF;
END$$

DELIMITER ;
