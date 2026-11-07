import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { Redis } from "ioredis";

// Builds the browser suite's own schema from empty: migrations, accounts and
// the seed. The suite then runs against it, so the development data never
// collects what the specs create.
if (existsSync(".env")) process.loadEnvFile(".env");

const name = process.env.DB_NAME ?? "";
if (!name.endsWith("_e2e")) {
  process.stderr.write(`e2e-db: refusing to rebuild "${name}", the name must end in _e2e\n`);
  process.exit(1);
}

const run = (script: string) =>
  execFileSync("pnpm", ["--silent", script], { stdio: ["ignore", "ignore", "inherit"] });

run("db:reset");
run("db:seed");

// caches, trending and login counters of the previous run
if (process.env.REDIS_URL) {
  const client = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await client.connect();
    for (const pattern of [`${name}:*`, `ls:${name}:*`]) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(...keys);
    }
  } catch {
    // without redis the app falls back to its in-process limiter
  } finally {
    client.disconnect();
  }
}

process.stdout.write(`${name} rebuilt and seeded\n`);
