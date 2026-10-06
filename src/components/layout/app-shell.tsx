import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { signOutAction } from "@/server/actions/sign-out";
import type { SessionUser } from "@/server/services/auth";
import { CommandPalette } from "./command-palette";
import { LiveEvents } from "./live-events";
import { ModeToggle } from "./mode-toggle";
import { NAV, ROLE_LABEL } from "./nav";
import { NavLinks } from "./nav-links";

/** The working shell for signed-in roles: one top bar, the page below it. */
export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-ink bg-paper">
        <div className="container-app flex h-[var(--bar-height)] items-center gap-6">
          <Wordmark />
          <nav aria-label={`${ROLE_LABEL[user.role]} sections`} className="min-w-0 flex-1">
            <NavLinks items={NAV[user.role]} />
          </nav>
          <div className="flex items-center gap-2">
            <p className="hidden text-right text-sm leading-tight sm:block">
              <span className="block font-medium text-ink">{user.fullName}</span>
              <span className="block text-muted">{ROLE_LABEL[user.role]}</span>
            </p>
            <CommandPalette role={user.role} />
            <ModeToggle />
            <form action={signOutAction}>
              <button type="submit" className="btn">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="container-app py-[var(--space-xl)]">
        {children}
      </main>
      {user.role === "LIBRARIAN" ? null : <LiveEvents />}
    </>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-[var(--space-xl)] grid gap-2">
      <h1>{title}</h1>
      {description ? <p className="max-w-[60ch] text-muted">{description}</p> : null}
    </div>
  );
}

/** What belongs in a region before it has anything, and how it fills. */
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ruled max-w-[44rem]">
      <div className="grid gap-1 py-[var(--space-lg)]">
        <h2 className="text-lg">{title}</h2>
        <p className="text-muted">{children}</p>
      </div>
    </section>
  );
}
