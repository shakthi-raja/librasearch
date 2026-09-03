import "server-only";
import type { Route } from "next";
import { cookies, headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import type { RoleName } from "@/server/repositories/auth";
import { type RequestMeta, type SessionUser, sessionFromToken } from "@/server/services/auth";
import { sessionCookieName } from "./cookie";

/** The signed-in user for this request, resolved once per render. */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return sessionFromToken(store.get(sessionCookieName())?.value);
});

/** Server-side gate for pages and actions: no session redirects, wrong role is a 403. */
export async function requireUser(...roles: RoleName[]): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role)) forbidden();
  return user;
}

export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return { ip: forwarded || h.get("x-real-ip"), userAgent: h.get("user-agent") };
}

export const HOME_BY_ROLE: Record<RoleName, Route> = {
  STUDENT: "/student",
  FACULTY: "/faculty",
  LIBRARIAN: "/admin",
};
