/**
 * Comparing a scanned rack with the catalogue. A copy belongs on the shelf
 * when it is AVAILABLE on this rack; everything else a scan finds is either
 * on the wrong rack or in a state the system did not expect.
 */

export type StockCopy = {
  copyId: number;
  barcode: string;
  title: string;
  rack: string;
  shelf: string;
  status: string;
};

export type StockReport = {
  found: StockCopy[];
  missing: StockCopy[];
  misplaced: StockCopy[];
  unexpected: StockCopy[];
};

export function compareRack(rack: string, onRack: StockCopy[], scanned: StockCopy[]): StockReport {
  const scannedIds = new Set(scanned.map((copy) => copy.copyId));
  const expected = onRack.filter((copy) => copy.rack === rack && copy.status === "AVAILABLE");
  const byShelf = (a: StockCopy, b: StockCopy) =>
    a.shelf.localeCompare(b.shelf) || a.barcode.localeCompare(b.barcode);

  return {
    found: scanned.filter((c) => c.rack === rack && c.status === "AVAILABLE").sort(byShelf),
    missing: expected.filter((c) => !scannedIds.has(c.copyId)).sort(byShelf),
    misplaced: scanned.filter((c) => c.rack !== rack).sort(byShelf),
    unexpected: scanned.filter((c) => c.rack === rack && c.status !== "AVAILABLE").sort(byShelf),
  };
}
