-- Google accounts linked to library members. A member is provisioned by the
-- library; signing in with Google never creates one, it only finds the member
-- a verified Google address belongs to. One Google account per member, and a
-- Google account can belong to one member only.

CREATE TABLE oauth_accounts (
  oauth_account_id INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED    NOT NULL,
  provider         ENUM('GOOGLE')  NOT NULL,
  subject          VARCHAR(255)    NOT NULL,
  email            VARCHAR(254)    NOT NULL,
  linked_at        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_used_at     DATETIME(3)     NULL,
  CONSTRAINT pk_oauth_accounts PRIMARY KEY (oauth_account_id),
  CONSTRAINT uq_oauth_accounts_subject UNIQUE (provider, subject),
  CONSTRAINT uq_oauth_accounts_user UNIQUE (user_id, provider),
  CONSTRAINT fk_oauth_accounts_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_oauth_accounts_subject CHECK (CHAR_LENGTH(subject) BETWEEN 1 AND 255),
  CONSTRAINT ck_oauth_accounts_email CHECK (
    REGEXP_LIKE(email, '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$', 'c')
  ),
  CONSTRAINT ck_oauth_accounts_used CHECK (last_used_at IS NULL OR last_used_at >= linked_at)
) ENGINE = InnoDB;

-- The sign-in path finds, links and unlinks; it cannot rewrite who an
-- account belongs to.
GRANT SELECT, INSERT, DELETE ON oauth_accounts TO r_auth;
GRANT UPDATE (last_used_at) ON oauth_accounts TO r_auth;
GRANT SELECT (user_id, provider, email, linked_at, last_used_at) ON oauth_accounts TO r_librarian;

DELIMITER $$

CREATE TRIGGER trg_oauth_accounts_ai
AFTER INSERT ON oauth_accounts
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES (
    'oauth_accounts',
    NEW.oauth_account_id,
    'INSERT',
    COALESCE(@app_user_id, NEW.user_id),
    JSON_OBJECT('user_id', NEW.user_id, 'provider', NEW.provider, 'email', NEW.email)
  );
END$$

CREATE TRIGGER trg_oauth_accounts_ad
AFTER DELETE ON oauth_accounts
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES (
    'oauth_accounts',
    OLD.oauth_account_id,
    'DELETE',
    COALESCE(@app_user_id, OLD.user_id),
    JSON_OBJECT('user_id', OLD.user_id, 'provider', OLD.provider, 'email', OLD.email)
  );
END$$

DELIMITER ;
