"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { stockScanAction } from "@/app/admin/stocktake/actions";
import { CameraScanner } from "@/components/scan/camera-scanner";
import { parseScan } from "@/lib/circulation/scan";

const VERDICT = {
  FOUND: "On the right rack",
  MISPLACED: "Belongs on another rack",
  UNEXPECTED: "Not expected here",
} as const;

/**
 * Scans copies one after another: the camera reopens after each read, so a
 * whole shelf can be walked without touching the screen. A typed barcode
 * works too, for a handheld scanner or a damaged label.
 */
export function StockScanner({ stocktakeId }: { stocktakeId: number }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [typed, setTyped] = useState("");
  const [log, setLog] = useState<{ key: number; text: string; good: boolean }[]>([]);

  const record = useCallback(
    async (raw: string) => {
      const scan = parseScan(raw);
      if (scan?.kind !== "copy") {
        setLog((entries) => [
          { key: Date.now(), text: "Not a copy label.", good: false },
          ...entries,
        ]);
        return;
      }
      const result = await stockScanAction(stocktakeId, scan.barcode);
      const text = result.ok
        ? `${scan.barcode} ${result.outcome.copy.title}: ${VERDICT[result.outcome.verdict]}${result.outcome.again ? " (already scanned)" : ""}`
        : `${scan.barcode}: ${result.error}`;
      const good = result.ok && result.outcome.verdict === "FOUND";
      setLog((entries) => [{ key: Date.now(), text, good }, ...entries].slice(0, 12));
      router.refresh();
    },
    [stocktakeId, router],
  );

  const onScan = useCallback(
    async (text: string) => {
      setScanning(false);
      await record(text);
      // keep walking: reopen the camera for the next copy
      setTimeout(() => setScanning(true), 500);
    },
    [record],
  );

  return (
    <div className="grid gap-[var(--space-sm)]">
      <div className="flex flex-wrap items-end gap-[var(--space-sm)]">
        <button type="button" className="btn btn-primary" onClick={() => setScanning(true)}>
          Scan with the camera
        </button>
        <form
          className="flex gap-[var(--space-xs)]"
          onSubmit={(event) => {
            event.preventDefault();
            if (typed.trim()) record(typed.trim());
            setTyped("");
          }}
        >
          <label htmlFor="stock-barcode" className="sr-only">
            Copy barcode
          </label>
          <input
            id="stock-barcode"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="LS26000005"
            autoComplete="off"
            className="input w-40"
          />
          <button type="submit" className="btn">
            Add
          </button>
        </form>
      </div>
      <ul aria-live="polite" className="grid gap-1 text-sm">
        {log.map((entry) => (
          <li key={entry.key} className={entry.good ? "text-ink-2" : "text-error"}>
            {entry.text}
          </li>
        ))}
      </ul>
      {scanning ? (
        <CameraScanner
          label="Scan the next copy on the rack"
          onScan={onScan}
          onClose={() => setScanning(false)}
        />
      ) : null}
    </div>
  );
}
