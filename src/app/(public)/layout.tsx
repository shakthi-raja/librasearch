import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="container-app py-[var(--space-xl)]">
        {children}
      </main>
    </>
  );
}
