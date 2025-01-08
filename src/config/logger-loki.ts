import pino from "pino";
import type { LokiOptions } from "pino-loki";

const transport = pino.transport<LokiOptions>({
  target: "pino-loki",
  options: {
    batching: true,
    interval: 2,
    host: `${process.env.LOKI_URI}`,
    labels: {
      app: "datingmatch-app",
      environment: "production",
      service: "logger-service",
    },
  },
});

const logger = pino(transport);

export default logger;
