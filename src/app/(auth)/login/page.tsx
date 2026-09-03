import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser, HOME_BY_ROLE } from "@/server/auth/current";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await currentUser();
  if (user) redirect(HOME_BY_ROLE[user.role]);
  const { next } = await searchParams;

  return (
    <main>
      <h1>Sign in</h1>
      <p>Use your university ID or college email.</p>
      <SignInForm next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
