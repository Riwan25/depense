import { LogContext$, type LogContext } from "@repo/utils";
import type { Context, Next } from "hono";

import { logger } from "@/lib/logger";

declare module "hono" {
  interface ContextVariableMap {
    logContext: LogContext;
  }
}

export const useLoggerContext = async (c: Context, next: Next) => {
  const start = Date.now();
  c.set(
    "logContext",
    LogContext$.parse({
      requestId: c.req.header("x-request-id") ?? crypto.randomUUID(),
      method: c.req.method,
      path: c.req.path,
      userId: c.get("user")?.id,
    }),
  );

  logger.info(`Incoming request: ${c.req.method} ${c.req.path}`);

  try {
    await next();
  } finally {
    const logLevel = c.res.status >= 500 ? "error" : c.res.status >= 400 ? "warn" : "info";
    logger.log({
      level: logLevel,
      message: `Request ${c.req.method} ${c.req.path} completed`,
      statusCode: c.res.status,
      metadata: {
        durationMs: Date.now() - start,
      },
    });
  }
};
