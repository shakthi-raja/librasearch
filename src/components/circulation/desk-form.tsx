"use client";

import {
  type KeyboardEvent,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { type DeskState, deskAction, resolveCardAction } from "@/app/admin/circulation/actions";
import { CameraScanner } from "@/components/scan/camera-scanner";
import { parseScan } from "@/lib/circulation/scan";
import type { DeskPolicy, DeskReceipt } from "@/lib/circulation/types";
import { formatDateTime, formatMoney, formatPeriod } from "@/lib/format";

type Mode = "issue" | "return";

export function DeskForm({
  policy,
  initialMode = "issue",
  initialBarcode = "",
}: {
  policy: DeskPolicy;
  initialMode?: Mode;
  initialBarcode?: string;
}) {
  const [state, formAction, pending] = useActionState<DeskState, FormData>(deskAction, {});
  const [mode, setMode] = useState<Mode>(initialMode);
  const [member, setMember] = useState("");
  const [barcode, setBarcode] = useState(initialBarcode);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);

  const onScan = useCallback(async (text: string) => {
    setScanning(false);
    const scan = parseScan(text);
    if (!scan) {
      setScanNote("That code is not a LibraSearch label or library card.");
      return;
    }
    if (scan.kind === "copy") {
      setBarcode(scan.barcode);
      setScanNote(`Copy ${scan.barcode} scanned.`);
      barcodeRef.current?.focus();
      return;
    }
    const result = await resolveCardAction(scan.token);
    if ("error" in result) {
      setScanNote(result.error);
      return;
    }
    setMode("issue");
    setMember(result.universityId);
    setScanNote(`Card for ${result.universityId} scanned.`);
    barcodeRef.current?.focus();
  }, []);
  const memberRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "issue") memberRef.current?.focus();
    else barcodeRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (state.receipt) {
      setMember("");
      setBarcode("");
      memberRef.current?.focus();
      return;
    }
    if (state.fieldErrors?.member) memberRef.current?.focus();
    else if (state.error || state.fieldErrors?.barcode) barcodeRef.current?.focus();
  }, [state]);

  const memberError = state.fieldErrors?.member;
  const barcodeError = state.fieldErrors?.barcode;

  // The desk runs on scans: Enter moves from the member to the barcode, the
  // barcode's Enter submits, and Escape clears the field under the caret.
  const memberKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      barcodeRef.current?.focus();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setMember("");
    }
  };

  const barcodeKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && pending) {
      event.preventDefault();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setBarcode("");
    }
  };

  return (
    <div className="grid gap-[var(--space-xl)]">
      <section aria-labelledby="desk-form-heading" className="grid gap-[var(--space-lg)]">
        <div className="grid gap-[var(--space-sm)]">
          <h2 id="desk-form-heading" className="text-lg">
            Issue or return a copy
          </h2>
          <fieldset className="segmented w-fit min-w-0">
            <legend className="sr-only">Desk action</legend>
            <button
              type="button"
              className="btn"
              aria-pressed={mode === "issue"}
              disabled={pending}
              onClick={() => setMode("issue")}
            >
              Issue
            </button>
            <button
              type="button"
              className="btn"
              aria-pressed={mode === "return"}
              disabled={pending}
              onClick={() => setMode("return")}
            >
              Return
            </button>
          </fieldset>
        </div>

        <form
          action={formAction}
          noValidate
          aria-busy={pending}
          className="grid gap-[var(--space-sm)]"
        >
          <input type="hidden" name="mode" value={mode} />

          <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
            <button type="button" className="btn" onClick={() => setScanning(true)}>
              Scan with the camera
            </button>
            <p role="status" aria-live="polite" className="text-sm text-muted">
              {scanNote}
            </p>
          </div>
          {scanning ? <CameraScanner onScan={onScan} onClose={() => setScanning(false)} /> : null}

          {state.error ? (
            <p role="alert" className="alert">
              {state.error}
            </p>
          ) : null}

          {mode === "issue" ? (
            <div>
              <div className="field">
                <label htmlFor="member">Member: university ID or email</label>
                <input
                  ref={memberRef}
                  id="member"
                  name="member"
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                  value={member}
                  onChange={(event) => setMember(event.target.value)}
                  onKeyDown={memberKeys}
                  required
                  aria-invalid={memberError ? true : undefined}
                  aria-describedby={memberError ? "member-error" : "desk-hint"}
                />
              </div>
              <p id="member-error" className="field-message">
                {memberError}
              </p>
            </div>
          ) : null}

          <div>
            <div className="field field-figure">
              <label htmlFor="barcode">Copy barcode</label>
              <input
                ref={barcodeRef}
                id="barcode"
                name="barcode"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="characters"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                onKeyDown={barcodeKeys}
                required
                aria-invalid={barcodeError ? true : undefined}
                aria-describedby={barcodeError ? "barcode-error" : "desk-hint"}
              />
            </div>
            <p id="barcode-error" className="field-message">
              {barcodeError}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
            <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
              {pending
                ? mode === "issue"
                  ? "Issuing copy"
                  : "Returning copy"
                : mode === "issue"
                  ? "Issue copy"
                  : "Return copy"}
            </button>
            <p id="desk-hint" className="text-sm text-muted">
              {mode === "issue"
                ? "Scan the barcode and press Enter. The member is checked before the loan is written."
                : "Scan the barcode. The fine and the next hold are decided by the database."}
            </p>
          </div>
        </form>
      </section>

      <div aria-live="polite">
        {state.receipt ? (
          <Receipt receipt={state.receipt} />
        ) : (
          <EmptySlip policy={policy} mode={mode} />
        )}
      </div>
    </div>
  );
}

function Receipt({ receipt }: { receipt: DeskReceipt }) {
  const issue = receipt.kind === "ISSUE";
  return (
    <article className="entry print-area" aria-labelledby="receipt-heading">
      <header className="entry-head flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1 px-[var(--space-lg)] py-[var(--space-md)]">
        <h2 id="receipt-heading" className="text-lg">
          {issue ? "Loan slip" : "Return slip"}
        </h2>
        <p className="figure text-sm">Loan {receipt.loanId}</p>
      </header>

      <div className="notebook grid gap-x-[var(--space-lg)] gap-y-[var(--space-md)] p-[var(--space-lg)] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-xs text-muted">Copy</p>
          <p className="text-lg leading-tight text-ink">{receipt.copy.title}</p>
          <p className="text-sm text-ink-2">{receipt.copy.authors}</p>
          <p className="text-sm text-muted">
            Edition {receipt.copy.editionNo}, ISBN{" "}
            <span className="figure">{receipt.copy.isbn13}</span>
          </p>
        </div>

        <div>
          <p className="text-xs text-muted">Member</p>
          <p className="text-ink">{receipt.member.fullName}</p>
          <p className="figure text-sm">{receipt.member.universityId}</p>
        </div>

        <div>
          <p className="text-xs text-muted">Barcode and shelf</p>
          <p className="figure text-ink">{receipt.copy.barcode}</p>
          <p className="text-sm text-ink-2">
            {receipt.copy.rack}, shelf {receipt.copy.shelf}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted">Issued</p>
          <p className="figure text-sm">{formatDateTime(receipt.issuedAt)}</p>
        </div>

        <div>
          <p className="text-xs text-muted">{issue ? "Due" : "Returned"}</p>
          <p className="figure text-sm">
            {issue
              ? formatDateTime(receipt.dueAt)
              : formatDateTime(receipt.returnedAt ?? receipt.dueAt)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted">Lending rule</p>
          <p className="text-sm text-ink">{formatPeriod(receipt.periodRule)}</p>
        </div>

        <div>
          <p className="text-xs text-muted">Active loans</p>
          <p className="figure text-sm">
            {receipt.member.activeLoans} of {receipt.member.maxLoans}
          </p>
          {Number(receipt.member.unpaidFines) > 0 ? (
            <p className="text-xs text-error">
              Unpaid fines {formatMoney(receipt.member.unpaidFines)}
            </p>
          ) : null}
        </div>

        {receipt.fine ? (
          <div className="border-t border-ink pt-[var(--space-sm)] sm:col-span-2">
            <p className="text-xs text-muted">Fine</p>
            <p className="text-lg text-ink">{formatMoney(receipt.fine.amount)}</p>
            <p className="text-sm text-ink-2">
              {receipt.fine.daysOverdue} days late, {receipt.fine.status.toLowerCase()}
            </p>
          </div>
        ) : null}

        {receipt.nextHold ? (
          <div className="border-t border-rule pt-[var(--space-sm)] sm:col-span-2">
            <p className="text-xs text-muted">Next hold</p>
            <p className="text-sm text-ink">
              Held for {receipt.nextHold.memberName}, pickup by{" "}
              <span className="figure">{formatDateTime(receipt.nextHold.pickupBy)}</span>
            </p>
          </div>
        ) : null}
      </div>

      <footer className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-rule px-[var(--space-lg)] py-[var(--space-md)]">
        <button type="button" className="btn" onClick={() => window.print()}>
          Print receipt
        </button>
        <p className="text-sm text-muted">
          {issue
            ? "Keep this slip until the copy is returned."
            : "The copy is back on the shelf or held for the next member."}
        </p>
      </footer>
    </article>
  );
}

function EmptySlip({ policy, mode }: { policy: DeskPolicy; mode: Mode }) {
  return (
    <section className="ruled" aria-labelledby="empty-slip-heading">
      <div className="grid gap-1 py-[var(--space-lg)]">
        <h2 id="empty-slip-heading" className="text-lg">
          The next slip appears here
        </h2>
        <p className="max-w-[58ch] text-muted">
          {mode === "issue"
            ? `A loan slip records the member, the copy, the due date and the lending rule. Regular loans run ${policy.regularLoanDays} days.`
            : "A return slip records the fine, if any, and the next member in the queue for the copy."}
        </p>
      </div>
    </section>
  );
}
