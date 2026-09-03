import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { StackMap } from "@/components/stack-map/stack-map";
import { currentUser, HOME_BY_ROLE } from "@/server/auth/current";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await currentUser();
  if (user) redirect(HOME_BY_ROLE[user.role]);
  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <main className="flex flex-col px-[var(--gutter)] py-[var(--space-lg)]">
        <Wordmark />
        <div className="my-auto w-full max-w-[24rem] self-center py-[var(--space-2xl)]">
          <div className="mb-[var(--space-xl)] grid gap-2">
            <h1>Sign in</h1>
            <p className="text-muted">Use your university ID or college email.</p>
          </div>
          <SignInForm next={typeof next === "string" ? next : undefined} />
        </div>
      </main>
      <aside className="hidden border-l border-ink lg:block" aria-hidden="true">
        <StackMap title="Plan of the library floor" />
      </aside>
    </div>
  );
}
