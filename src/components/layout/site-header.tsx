import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { currentUser } from "@/server/auth/current";
import { ModeToggle } from "./mode-toggle";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-ink bg-paper">
      <div className="container-app flex h-[var(--bar-height)] items-center justify-between gap-4">
        <Wordmark />
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <Link href="/search" className="nav-link">
            Search
          </Link>
          <Link href="/catalog" className="nav-link">
            Catalogue
          </Link>
          <ModeToggle />
          {user ? (
            <Link href="/account" className="btn">
              Account
            </Link>
          ) : (
            <Link href="/login" className="btn">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
