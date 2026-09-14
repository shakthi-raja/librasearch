import { env } from "@/lib/config/env";
import { ensureCollections } from "@/server/vector/qdrant";
import { closeWorkerDb, workerDb } from "./db";
import { runOnce } from "./jobs";
import { log } from "./log";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let stopping = false;

async function main() {
  const config = env();
  const db = workerDb();

  try {
    await ensureCollections();
  } catch (error) {
    log.warn({ err: error }, "qdrant unavailable at start; retrying on the next poll");
  }

  log.info({ pollMs: config.WORKER_POLL_MS, batch: config.WORKER_BATCH_SIZE }, "worker started");

  while (!stopping) {
    try {
      const processed = await runOnce(db, config.WORKER_BATCH_SIZE);
      if (processed === 0) await sleep(config.WORKER_POLL_MS);
    } catch (error) {
      log.error({ err: error }, "poll failed");
      await sleep(config.WORKER_POLL_MS);
    }
  }

  await closeWorkerDb();
  log.info("worker stopped");
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopping = true;
  });
}

main().catch((error) => {
  log.error({ err: error }, "worker crashed");
  process.exitCode = 1;
});
