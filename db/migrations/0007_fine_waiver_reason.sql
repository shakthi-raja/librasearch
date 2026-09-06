-- A CHECK that evaluates to UNKNOWN passes, so the original waiver rule let a
-- fine be waived with no reason at all when waiver_reason was NULL.

ALTER TABLE fines DROP CHECK ck_fines_waiver;

ALTER TABLE fines
  ADD CONSTRAINT ck_fines_waiver CHECK (
    status <> 'WAIVED' OR (waiver_reason IS NOT NULL AND CHAR_LENGTH(TRIM(waiver_reason)) >= 5)
  );
