CREATE TABLE fixture_items (
  item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  label   VARCHAR(40)  NOT NULL,
  CONSTRAINT pk_fixture_items PRIMARY KEY (item_id)
);

INSERT INTO fixture_items (label) VALUES ('one; with a semicolon'), ('two');
