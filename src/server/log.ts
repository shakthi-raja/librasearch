import "server-only";
import pino from "pino";
import { env } from "@/lib/config/env";

const globalForLog = globalThis as unknown as { librasearchLog?: pino.Logger };

/** One structured logger per process. Secrets are redacted by path. */
export const log: pino.Logger =
  globalForLog.librasearchLog ??
  pino({
    level: env().LOG_LEVEL,
    base: { service: "web" },
    redact: {
      paths: [
        "password",
        "*.password",
        "token",
        "*.token",
        "passwordHash",
        "*.passwordHash",
        "cookie",
      ],
      censor: "[redacted]",
    },
    ...(env().NODE_ENV === "development"
      ? { transport: { target: "pino-pretty", options: { colorize: true, singleLine: true } } }
      : {}),
  });

globalForLog.librasearchLog = log;
