/**
 * When a reader can expect a copy that is all out. Copies come back in due
 * date order; each one serves the next member in the queue, and once every
 * copy has been handed on it comes round again after one loan period.
 */

export type WaitInput = {
  /** Due dates of the borrowable copies that are out, in any order. */
  dueDates: Date[];
  /** Members ahead of this reader in the hold queue. */
  ahead: number;
  /** Loan length for the members ahead, in days. */
  loanDays: number;
  now: Date;
};

export type WaitEstimate = {
  /** The earliest day a copy should be in the reader's hands. */
  date: Date;
  /** True when the copy that decides it is already overdue. */
  overdue: boolean;
  /** Members ahead, so the page can say "third in line". */
  ahead: number;
};

const DAY = 24 * 3600 * 1000;

export function estimateWait({ dueDates, ahead, loanDays, now }: WaitInput): WaitEstimate | null {
  if (dueDates.length === 0) return null;
  const sorted = [...dueDates].sort((a, b) => a.getTime() - b.getTime());
  const round = Math.floor(ahead / sorted.length);
  const due = sorted[ahead % sorted.length] as Date;
  const overdue = round === 0 && due.getTime() < now.getTime();
  // an overdue copy could be back any day; count from today, not the past
  const base = Math.max(due.getTime(), now.getTime());
  return { date: new Date(base + round * loanDays * DAY), overdue, ahead };
}
