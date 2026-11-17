import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { currentUser } from "@/server/auth/current";
import { MobileMenu } from "./mobile-menu";
import { ModeToggle } from "./mode-toggle";
import type { NavItem } from "./nav";

const PUBLIC_NAV: NavItem[] = [
  { href: "/search", label: "Search" },
  { href: "/catalog", label: "Catalogue" },
  { href: "/open", label: "Open shelf" },
];

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-ink bg-paper">
      <div className="container-app flex h-[var(--bar-height)] items-center justify-between gap-4">
        <Wordmark />
        <div className="flex items-center gap-1 sm:gap-2">
          {/* wide screens list the pages inline; narrow ones fold them into the menu */}
          <nav aria-label="Site" className="hidden items-center gap-1 sm:gap-2 md:flex">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <MobileMenu items={PUBLIC_NAV} label="Site" className="md:hidden" />
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
        </div>
      </div>
    </header>
  );
}
