-- Indexes the operational screens ask for: exam windows per offering, the
-- thirty-day analytics window, and the waiting-hold count.

CREATE INDEX ix_exam_windows_offering_end ON exam_windows (offering_id, end_date);
CREATE INDEX ix_loans_issued ON loans (issued_at);
CREATE INDEX ix_holds_status ON holds (status, placed_at);
