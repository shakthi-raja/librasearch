-- Stocktake: a librarian walks one rack and scans what is really there. The
-- comparison with what the catalogue expects is computed, never stored, so a
-- scan made late still changes the report.

CREATE TABLE stocktakes (
  stocktake_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rack_code    VARCHAR(8)   NOT NULL,
  started_by   INT UNSIGNED NULL,
  started_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  closed_at    DATETIME(3)  NULL,
  CONSTRAINT pk_stocktakes PRIMARY KEY (stocktake_id),
  CONSTRAINT fk_stocktakes_started_by FOREIGN KEY (started_by)
    REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_stocktakes_rack CHECK (REGEXP_LIKE(rack_code, '^[A-Z]{2,3}-[0-9]{2}$', 'c')),
  CONSTRAINT ck_stocktakes_closed CHECK (closed_at IS NULL OR closed_at >= started_at),
  INDEX ix_stocktakes_rack (rack_code, started_at)
) ENGINE = InnoDB;

CREATE TABLE stocktake_scans (
  stocktake_id INT UNSIGNED NOT NULL,
  copy_id      INT UNSIGNED NOT NULL,
  scanned_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_stocktake_scans PRIMARY KEY (stocktake_id, copy_id),
  CONSTRAINT fk_stocktake_scans_stocktake FOREIGN KEY (stocktake_id)
    REFERENCES stocktakes (stocktake_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_stocktake_scans_copy FOREIGN KEY (copy_id)
    REFERENCES copies (copy_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- A closed stocktake is a record; scans cannot be added to it afterwards.
DELIMITER $$

CREATE TRIGGER trg_stocktake_scans_bi
BEFORE INSERT ON stocktake_scans
FOR EACH ROW
BEGIN
  IF (SELECT closed_at FROM stocktakes WHERE stocktake_id = NEW.stocktake_id) IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LS301: this stocktake is closed';
  END IF;
END$$

DELIMITER ;

GRANT SELECT, INSERT, UPDATE (closed_at) ON stocktakes TO r_librarian;
GRANT SELECT, INSERT ON stocktake_scans TO r_librarian;
