-- What students type is often an abbreviation: cn, dbms, daa, coa. An alias
-- expands such a word before keyword and semantic search run, so "cn" finds
-- computer networks instead of whatever the embedding model guesses. The
-- library seeds the common ones from course names and curates the rest.

CREATE TABLE search_aliases (
  alias      VARCHAR(40)                   NOT NULL,
  expansion  VARCHAR(200)                  NOT NULL,
  source     ENUM('SEEDED', 'LIBRARIAN')   NOT NULL DEFAULT 'LIBRARIAN',
  created_by INT UNSIGNED                  NULL,
  created_at DATETIME(3)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_search_aliases PRIMARY KEY (alias),
  CONSTRAINT fk_search_aliases_created_by FOREIGN KEY (created_by)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  -- one lowercase word or a short slash or plus form such as ui/ux or c++
  CONSTRAINT ck_search_aliases_alias CHECK (REGEXP_LIKE(alias, '^[a-z0-9][a-z0-9+#/.]{0,39}$', 'c')),
  CONSTRAINT ck_search_aliases_expansion CHECK (CHAR_LENGTH(TRIM(expansion)) >= 3),
  CONSTRAINT ck_search_aliases_distinct CHECK (LOWER(TRIM(expansion)) <> alias)
) ENGINE = InnoDB;

GRANT SELECT ON search_aliases TO r_student;
GRANT SELECT, INSERT, UPDATE, DELETE ON search_aliases TO r_librarian;

DELIMITER $$

CREATE TRIGGER trg_search_aliases_ai
AFTER INSERT ON search_aliases
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('search_aliases', NEW.alias, 'INSERT', @app_user_id,
          JSON_OBJECT('expansion', NEW.expansion, 'source', NEW.source));
END$$

CREATE TRIGGER trg_search_aliases_au
AFTER UPDATE ON search_aliases
FOR EACH ROW
BEGIN
  IF NOT (OLD.expansion <=> NEW.expansion) THEN
    INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES ('search_aliases', NEW.alias, 'UPDATE', @app_user_id,
            JSON_OBJECT('expansion', OLD.expansion), JSON_OBJECT('expansion', NEW.expansion));
  END IF;
END$$

CREATE TRIGGER trg_search_aliases_ad
AFTER DELETE ON search_aliases
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('search_aliases', OLD.alias, 'DELETE', @app_user_id,
          JSON_OBJECT('expansion', OLD.expansion, 'source', OLD.source));
END$$

DELIMITER ;
