-- Outbox triggers. A write to the catalogue or the syllabus records what the
-- worker must do; the write itself never waits for Qdrant. Text changes are
-- UPSERT, metadata changes are PAYLOAD, a withdrawn book or a deleted row is
-- DELETE.

DELIMITER $$

CREATE TRIGGER trg_books_outbox_ai
AFTER INSERT ON books
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('BOOK', NEW.book_id, 'UPSERT');
END$$

CREATE TRIGGER trg_books_outbox_au
AFTER UPDATE ON books
FOR EACH ROW
BEGIN
  IF NEW.status = 'WITHDRAWN' AND OLD.status <> 'WITHDRAWN' THEN
    INSERT INTO embedding_outbox (entity_type, entity_id, operation)
    VALUES ('BOOK', NEW.book_id, 'DELETE');
  ELSEIF NEW.status = 'ACTIVE' AND OLD.status <> 'ACTIVE' THEN
    INSERT INTO embedding_outbox (entity_type, entity_id, operation)
    VALUES ('BOOK', NEW.book_id, 'UPSERT');
  ELSEIF NOT (OLD.title <=> NEW.title)
      OR NOT (OLD.subtitle <=> NEW.subtitle)
      OR NOT (OLD.description <=> NEW.description) THEN
    INSERT INTO embedding_outbox (entity_type, entity_id, operation)
    VALUES ('BOOK', NEW.book_id, 'UPSERT');
  ELSEIF NOT (OLD.category_id <=> NEW.category_id)
      OR NOT (OLD.language <=> NEW.language) THEN
    INSERT INTO embedding_outbox (entity_type, entity_id, operation)
    VALUES ('BOOK', NEW.book_id, 'PAYLOAD');
  END IF;
END$$

CREATE TRIGGER trg_books_outbox_ad
AFTER DELETE ON books
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('BOOK', OLD.book_id, 'DELETE');
END$$

CREATE TRIGGER trg_editions_outbox_ai
AFTER INSERT ON editions
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('EDITION', NEW.edition_id, 'UPSERT');
END$$

CREATE TRIGGER trg_editions_outbox_au
AFTER UPDATE ON editions
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('EDITION', NEW.edition_id, 'PAYLOAD');
END$$

CREATE TRIGGER trg_editions_outbox_ad
AFTER DELETE ON editions
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('EDITION', OLD.edition_id, 'DELETE');
END$$

CREATE TRIGGER trg_chapters_outbox_ai
AFTER INSERT ON chapters
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('CHAPTER', NEW.chapter_id, 'UPSERT');
END$$

CREATE TRIGGER trg_chapters_outbox_au
AFTER UPDATE ON chapters
FOR EACH ROW
BEGIN
  IF NOT (OLD.title <=> NEW.title) OR NOT (OLD.summary <=> NEW.summary) THEN
    INSERT INTO embedding_outbox (entity_type, entity_id, operation)
    VALUES ('CHAPTER', NEW.chapter_id, 'UPSERT');
  ELSEIF NOT (OLD.chapter_no <=> NEW.chapter_no)
      OR NOT (OLD.page_start <=> NEW.page_start)
      OR NOT (OLD.page_end <=> NEW.page_end) THEN
    INSERT INTO embedding_outbox (entity_type, entity_id, operation)
    VALUES ('CHAPTER', NEW.chapter_id, 'PAYLOAD');
  END IF;
END$$

CREATE TRIGGER trg_chapters_outbox_ad
AFTER DELETE ON chapters
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('CHAPTER', OLD.chapter_id, 'DELETE');
END$$

CREATE TRIGGER trg_units_outbox_ai
AFTER INSERT ON syllabus_units
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('UNIT', NEW.unit_id, 'UPSERT');
END$$

CREATE TRIGGER trg_units_outbox_au
AFTER UPDATE ON syllabus_units
FOR EACH ROW
BEGIN
  IF NOT (OLD.title <=> NEW.title)
      OR NOT (OLD.topics <=> NEW.topics)
      OR NOT (OLD.hours <=> NEW.hours) THEN
    INSERT INTO embedding_outbox (entity_type, entity_id, operation)
    VALUES ('UNIT', NEW.unit_id, 'UPSERT');
  END IF;
END$$

CREATE TRIGGER trg_units_outbox_ad
AFTER DELETE ON syllabus_units
FOR EACH ROW
BEGIN
  INSERT INTO embedding_outbox (entity_type, entity_id, operation)
  VALUES ('UNIT', OLD.unit_id, 'DELETE');
END$$

DELIMITER ;
