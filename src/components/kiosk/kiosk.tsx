"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type KioskMember,
  kioskCardAction,
  kioskIssueAction,
  kioskReturnAction,
} from "@/app/kiosk/actions";
import { CameraScanner } from "@/components/scan/camera-scanner";
import { parseScan } from "@/lib/circulation/scan";
import type { DeskReceipt } from "@/lib/circulation/types";
import { formatDate, formatMoney } from "@/lib/format";

type Step =
  | { name: "start" }
  | { name: "card" }
  | { name: "book"; token: string; member: KioskMember; done: DeskReceipt[] }
  | { name: "return"; done: DeskReceipt[] };

/** After this long without a touch, the kiosk forgets the member and starts over. */
const IDLE_MS = 45_000;

export function Kiosk() {
  const [step, setStep] = useState<Step>({ name: "start" });
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setStep({ name: "start" });
    setScanning(false);
    setMessage(null);
  }, []);

  // nobody else should see a member's loans once they walk away
  useEffect(() => {
    if (step.name === "start") return;
    const timer = setTimeout(reset, IDLE_MS);
    return () => clearTimeout(timer);
  }, [step, reset]);

  const onScan = useCallback(
    async (text: string) => {
      setScanning(false);
      setMessage(null);
      const scan = parseScan(text);
      setBusy(true);
      try {
        if (step.name === "card") {
          if (scan?.kind !== "card") {
            setMessage("Scan the QR on your library card page.");
            return;
          }
          const result = await kioskCardAction(scan.token);
          if (!result.ok) setMessage(result.error);
          else setStep({ name: "book", token: scan.token, member: result.value, done: [] });
          return;
        }
        if (scan?.kind !== "copy") {
          setMessage("Scan the QR label inside the book's cover.");
          return;
        }
        if (step.name === "book") {
          const result = await kioskIssueAction(step.token, scan.barcode);
          if (!result.ok) setMessage(result.error);
          else setStep({ ...step, done: [...step.done, result.value] });
        } else if (step.name === "return") {
          const result = await kioskReturnAction(scan.barcode);
          if (!result.ok) setMessage(result.error);
          else setStep({ ...step, done: [...step.done, result.value] });
        }
      } finally {
        setBusy(false);
      }
    },
    [step],
  );

  const scanLabel =
    step.name === "card" ? "Show your library card to the camera" : "Show the book's QR label";

  return (
    <div className="grid w-full max-w-[40rem] gap-[var(--space-lg)]">
      {step.name === "start" ? (
        <div className="grid gap-[var(--space-md)]">
          <h1 className="text-[length:var(--text-4xl)]">Self-checkout</h1>
          <p className="text-lg text-ink-2">Borrow with your library card, or return books.</p>
          <div className="grid gap-[var(--space-sm)] sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-primary btn-lg min-h-24 text-lg"
              onClick={() => {
                setStep({ name: "card" });
                setScanning(true);
              }}
            >
              Borrow books
            </button>
            <button
              type="button"
              className="btn btn-lg min-h-24 text-lg"
              onClick={() => {
                setStep({ name: "return", done: [] });
                setScanning(true);
              }}
            >
              Return books
            </button>
          </div>
        </div>
      ) : null}

      {step.name === "card" ? (
        <div className="grid gap-[var(--space-md)]">
          <h1 className="text-[length:var(--text-3xl)]">Scan your library card</h1>
          <p className="text-ink-2">Open Card in LibraSearch on your phone and hold it up.</p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setScanning(true)}
            disabled={busy}
          >
            Open the camera
          </button>
        </div>
      ) : null}

      {step.name === "book" ? (
        <div className="grid gap-[var(--space-md)]">
          <h1 className="text-[length:var(--text-3xl)]">Hello, {step.member.name}</h1>
          <p className="text-ink-2">
            You have {step.member.activeLoans + step.done.length} of {step.member.maxLoans} loans.
            Scan each book you want to take.
          </p>
          <Receipts receipts={step.done} />
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setScanning(true)}
            disabled={busy}
          >
            {step.done.length === 0 ? "Scan a book" : "Scan another book"}
          </button>
        </div>
      ) : null}

      {step.name === "return" ? (
        <div className="grid gap-[var(--space-md)]">
          <h1 className="text-[length:var(--text-3xl)]">Return books</h1>
          <p className="text-ink-2">Scan each book, then leave it on the returns trolley.</p>
          <Receipts receipts={step.done} />
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setScanning(true)}
            disabled={busy}
          >
            {step.done.length === 0 ? "Scan a book" : "Scan another book"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p role="alert" className="alert text-base">
          {message}
        </p>
      ) : null}

      {step.name !== "start" ? (
        <button type="button" className="btn" onClick={reset}>
          {step.name === "card" ? "Cancel" : "I'm done"}
        </button>
      ) : null}

      {scanning ? (
        <CameraScanner label={scanLabel} onScan={onScan} onClose={() => setScanning(false)} />
      ) : null}
    </div>
  );
}

function Receipts({ receipts }: { receipts: DeskReceipt[] }) {
  if (receipts.length === 0) return null;
  return (
    <ul className="ruled" aria-label="Done so far">
      {receipts.map((receipt) => (
        <li key={receipt.loanId} className="grid gap-0.5 py-[var(--space-sm)]">
          <span className="font-medium">{receipt.copy.title}</span>
          <span className="text-sm text-ink-2">
            {receipt.kind === "ISSUE"
              ? `Due back ${formatDate(receipt.dueAt)}`
              : receipt.fine
                ? `Returned, with a fine of ${formatMoney(receipt.fine.amount)} to settle at the desk`
                : "Returned, thank you"}
            {receipt.kind === "RETURN" && receipt.nextHold
              ? ". Someone is waiting for it; please leave it at the desk."
              : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
