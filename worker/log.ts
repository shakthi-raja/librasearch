import pino from "pino";
import { env } from "@/lib/config/env";

export const log = pino({
  level: env().LOG_LEVEL,
  base: { service: "worker" },
  redact: {
    paths: ["password", "*.password", "passwordHash", "*.passwordHash"],
    censor: "[redacted]",
  },
});
