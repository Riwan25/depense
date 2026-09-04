import { type LogData, type LogLevel } from "@repo/utils";
import { tryGetContext } from "hono/context-storage";
import { ENV } from "varlock/env";
import winston from "winston";
import LokiTransport from "winston-loki";

import rootPackageJson from "../../../../package.json" with { type: "json" };
import packageJson from "../../package.json" with { type: "json" };

const appLabel = `${rootPackageJson.name}-${packageJson.name}`;

class LokiStringMeta extends LokiTransport {
  override log(info: Record<string, unknown>, next: () => void) {
    const logContext = tryGetContext()?.var.logContext;

    for (const [key, value] of Object.entries({ ...logContext, ...info })) {
      if (key === "message" || key === "level") continue;

      if (typeof value === "string" || value == null) {
        info[key] = value;
        continue;
      }

      info[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
    }

    if (typeof super.log !== "function") {
      next();
      return;
    }

    return super.log(info, next);
  }
}

const isDev = ENV.APP_ENV === "development";

type MyLogger = {
  debug(message: string, meta?: LogData): void;
  info(message: string, meta?: LogData): void;
  warn(message: string, meta?: LogData): void;
  error(message: string, meta?: LogData): void;
  log({ level, message, ...meta }: { level: LogLevel; message: string } & LogData): void;
};

export const logger: MyLogger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  defaultMeta: {
    app: appLabel,
    environment: ENV.APP_ENV,
    version: packageJson.version,
  },
  transports: [
    ...(isDev || !ENV.LOKI_HOST
      ? [
          new winston.transports.Console({
            level: isDev ? "debug" : "warn",
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
          }),
        ]
      : []),
    ...(ENV.LOKI_HOST && ENV.APP_ENV !== "test"
      ? [
          new LokiStringMeta({
            host: ENV.LOKI_HOST,
            json: true,
            labels: {
              app: appLabel,
              environment: ENV.APP_ENV,
              version: packageJson.version,
            },
            // Keep request fields in the JSON line — not as Loki labels
            useWinstonMetaAsLabels: true,
          }),
        ]
      : []),
  ],
});
