"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearedSessionCookie, sessionCookieName } from "@/server/auth/cookie";
import { signOut } from "@/server/services/auth";

export async function signOutAction() {
  const store = await cookies();
  await signOut(store.get(sessionCookieName())?.value);
  store.set(clearedSessionCookie());
  redirect("/login");
}
