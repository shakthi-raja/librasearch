import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ModeToggle } from "./mode-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-ink bg-paper">
      <div className="container-app flex h-[var(--bar-height)] items-center justify-between gap-4">
        <Wordmark />
        <nav aria-label="Site" className="flex items-center gap-2">
          <ModeToggle />
          <Link href="/login" className="btn">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
