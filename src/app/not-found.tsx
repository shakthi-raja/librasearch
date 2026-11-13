import type { Metadata } from "next";
import { NotFoundMessage } from "@/components/layout/not-found-message";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "Page not found" };

/** An address outside every section: only the root layout is around it. */
export default function NotFound() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="container-app py-[var(--space-2xl)]">
        <NotFoundMessage />
      </main>
    </>
  );
}
