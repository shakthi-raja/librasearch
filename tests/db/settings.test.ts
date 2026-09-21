import type { Connection } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auditTables, auditTrail } from "@/server/services/audit";
import { librarySettings, updateSettings } from "@/server/services/settings";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let librarian: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
});

afterAll(async () => {
  await db.end();
});

describe("library settings", () => {
  it("reads the single settings row", async () => {
    const settings = await librarySettings();
    expect(settings.busyLoanDays).toBeGreaterThan(0);
    expect(settings.finePerDay).toBeGreaterThanOrEqual(0);
  });

  it("saves a change and records who made it", async () => {
    const before = await librarySettings();
    await updateSettings(
      {
        finePerDay: before.finePerDay,
        fineCap: before.fineCap,
        lostCopyFee: before.lostCopyFee,
        unpaidFineThreshold: before.unpaidFineThreshold,
        holdExpiryHours: before.holdExpiryHours,
        busyLoanDays: 9,
        waitsForBusyLoan: before.waitsForBusyLoan,
        shortLoanDays: 4,
        shortageThreshold: before.shortageThreshold,
        weakMatchThreshold: before.weakMatchThreshold,
      },
      librarian,
    );

    expect(await librarySettings()).toMatchObject({ busyLoanDays: 9, shortLoanDays: 4 });

    const trail = await auditTrail("library_settings", 5);
    expect(trail[0]).toMatchObject({
      tableName: "library_settings",
      recordId: "1",
      action: "UPDATE",
      actor: expect.stringMatching(/librarian/i),
    });
    expect(
      trail[0]?.changed.some(
        (change) => change.key === "busy_loan_days" && change.from === "7" && change.to === "9",
      ),
    ).toBe(true);
    expect(await auditTables()).toContain("library_settings");
  });

  it("lets the database reject an impossible combination", async () => {
    const before = await librarySettings();
    await expect(
      updateSettings(
        {
          finePerDay: before.finePerDay,
          fineCap: before.fineCap,
          lostCopyFee: before.lostCopyFee,
          unpaidFineThreshold: before.unpaidFineThreshold,
          holdExpiryHours: before.holdExpiryHours,
          busyLoanDays: 3,
          waitsForBusyLoan: before.waitsForBusyLoan,
          shortLoanDays: 6,
          shortageThreshold: before.shortageThreshold,
          weakMatchThreshold: before.weakMatchThreshold,
        },
        librarian,
      ),
    ).rejects.toThrow();
    expect((await librarySettings()).shortLoanDays).toBe(4);
  });
});
