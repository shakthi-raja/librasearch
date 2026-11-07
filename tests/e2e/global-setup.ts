import { mkdir } from "node:fs/promises";
import { type FullConfig, request } from "@playwright/test";
import { DEMO_PASSWORD, ROLES, type Role, storageFor } from "./roles";

/** Signs each seeded role in once through the API and saves the session for the specs. */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3100";
  await mkdir("tests/e2e/.auth", { recursive: true });
  for (const role of Object.keys(ROLES) as Role[]) {
    const context = await request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL } });
    const response = await context.post("/api/v1/auth/login", {
      data: { identifier: ROLES[role].identifier, password: DEMO_PASSWORD },
    });
    if (!response.ok()) throw new Error(`${role} could not sign in: ${response.status()}`);
    await context.storageState({ path: storageFor(role) });
    await context.dispose();
  }
}
