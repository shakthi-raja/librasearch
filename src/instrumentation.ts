// Runs once when a server process starts. A bad environment stops the process
// before it serves a single request.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("@/lib/config/env");
  env();
}
