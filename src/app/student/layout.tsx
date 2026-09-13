import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireUser("STUDENT", "FACULTY");
  return <AppShell user={user}>{children}</AppShell>;
}
