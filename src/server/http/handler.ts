import "server-only";
import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/config/env";
import { log } from "@/server/log";
import { AppError, type ErrorEnvelope } from "./errors";

type Context<P> = { params: Promise<P> };
type Handler<P> = (
  request: NextRequest,
  context: Context<P> & { requestId: string },
) => Promise<Response>;

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Mutations must come from our own origin. Browsers always send one of these headers. */
function assertSameOrigin(request: NextRequest) {
  if (!MUTATING.has(request.method)) return;
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin") return;
  const origin = request.headers.get("origin");
  if (origin !== null && origin === new URL(env().APP_URL).origin) return;
  throw new AppError("FORBIDDEN", "Cross-site request refused");
}

export function errorResponse(error: AppError, requestId: string) {
  const body: ErrorEnvelope = {
    error: { code: error.code, message: error.message, details: error.details },
    requestId,
  };
  return NextResponse.json(body, { status: error.status, headers: { "x-request-id": requestId } });
}

/** Wraps a route handler: request id, origin check, error envelope, logging. */
export function route<P = Record<string, never>>(handler: Handler<P>) {
  return async (request: NextRequest, context: Context<P>) => {
    const requestId = request.headers.get("x-request-id") ?? randomUUID();
    try {
      assertSameOrigin(request);
      const response = await handler(request, { ...context, requestId });
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      if (error instanceof AppError) return errorResponse(error, requestId);
      if (error instanceof z.ZodError) {
        return errorResponse(
          new AppError(
            "VALIDATION",
            "Some fields need attention",
            error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
          ),
          requestId,
        );
      }
      log.error({ err: error, requestId, path: request.nextUrl.pathname }, "unhandled route error");
      return errorResponse(new AppError("INTERNAL", "Something went wrong"), requestId);
    }
  };
}

/** Reads and validates a JSON body. A body that is not JSON is a 400, not a 500. */
export async function jsonBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError("BAD_REQUEST", "Expected a JSON body");
  }
  return schema.parse(raw);
}
