import { expect } from "vitest";

/** MySQL error numbers the schema tests assert on. */
export const ER = {
  DUP_ENTRY: 1062,
  ROW_IS_REFERENCED: 1451,
  NO_REFERENCED_ROW: 1452,
  CHECK_CONSTRAINT_VIOLATED: 3819,
  TABLEACCESS_DENIED: 1142,
  COLUMNACCESS_DENIED: 1143,
  SIGNAL_EXCEPTION: 1644,
  BAD_NULL: 1048,
  TRUNCATED_WRONG_VALUE: 1265,
} as const;

/** Awaits a statement that must fail with the given errno (and optional message pattern). */
export async function expectSqlError(work: Promise<unknown>, errno: number, message?: RegExp) {
  const error = await work.then(
    () => undefined,
    (reason: unknown) => reason as { errno?: number; sqlMessage?: string },
  );
  expect(error, "statement should have failed").toBeDefined();
  expect(error?.errno, error?.sqlMessage).toBe(errno);
  if (message) expect(error?.sqlMessage).toMatch(message);
}
