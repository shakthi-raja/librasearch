-- The issue transaction takes the copy row before it decides anything.
-- A second desk running the same SELECT would wait on this row until COMMIT.

START TRANSACTION;

SELECT copy_id, barcode, status
  FROM copies
 WHERE barcode = 'LS26000001'
   FOR UPDATE;

SELECT NOW(3) AS held_since;

-- The procedure does the same lock, then writes the loan and the copy state.
UPDATE copies SET status = 'ON_LOAN' WHERE barcode = 'LS26000001';
ROLLBACK;

SELECT copy_id, barcode, status
  FROM copies
 WHERE barcode = 'LS26000001';
