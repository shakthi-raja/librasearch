import { describe, expect, it } from "vitest";
import { compareRack, type StockCopy } from "@/lib/circulation/stocktake";

const copy = (copyId: number, rack: string, status = "AVAILABLE", shelf = "S1"): StockCopy => ({
  copyId,
  barcode: `LS${String(copyId).padStart(8, "0")}`,
  title: `Book ${copyId}`,
  rack,
  shelf,
  status,
});

describe("compareRack", () => {
  const onRack = [
    copy(1, "CS-04"),
    copy(2, "CS-04"),
    copy(3, "CS-04", "ON_LOAN"),
    copy(4, "CS-04", "LOST"),
  ];

  it("finds what is there and lists what is missing", () => {
    const report = compareRack("CS-04", onRack, [copy(1, "CS-04")]);
    expect(report.found.map((c) => c.copyId)).toEqual([1]);
    expect(report.missing.map((c) => c.copyId)).toEqual([2]);
  });

  it("does not expect copies that are out or already lost", () => {
    const report = compareRack("CS-04", onRack, [copy(1, "CS-04"), copy(2, "CS-04")]);
    expect(report.missing).toEqual([]);
  });

  it("flags a copy from another rack as misplaced", () => {
    const report = compareRack("CS-04", onRack, [copy(9, "MA-02")]);
    expect(report.misplaced.map((c) => c.copyId)).toEqual([9]);
  });

  it("flags a copy the system thinks is out or lost as unexpected", () => {
    const report = compareRack("CS-04", onRack, [
      copy(3, "CS-04", "ON_LOAN"),
      copy(4, "CS-04", "LOST"),
    ]);
    expect(report.unexpected.map((c) => c.copyId)).toEqual([3, 4]);
  });

  it("orders each list by shelf", () => {
    const report = compareRack(
      "CS-04",
      [copy(5, "CS-04", "AVAILABLE", "S3"), copy(6, "CS-04", "AVAILABLE", "S1")],
      [],
    );
    expect(report.missing.map((c) => c.copyId)).toEqual([6, 5]);
  });
});
