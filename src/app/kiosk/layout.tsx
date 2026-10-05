import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { requireUser } from "@/server/auth/current";

/** A full-screen kiosk: staff sign the device in once, members never see the staff screens. */
export default async function KioskLayout({ children }: { children: ReactNode }) {
  await requireUser("LIBRARIAN");
  return (
    <div className="grid min-h-dvh grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex items-center justify-between border-b border-ink px-[var(--gutter)] py-[var(--space-sm)]">
        <Wordmark />
        <p className="text-sm text-muted">Self-checkout</p>
      </header>
      <main className="grid place-items-center px-[var(--gutter)] py-[var(--space-xl)]">
        {children}
      </main>
    </div>
  );
}
