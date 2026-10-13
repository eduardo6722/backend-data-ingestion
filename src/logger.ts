import type { LoggerService } from '@nestjs/common';
import pino from 'pino';
import './config';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  enabled: process.env.NODE_ENV !== 'test',
});

export const nestLogger: LoggerService = {
  log(message, context) {
    logger.info({ context }, String(message));
  },
  error(message, trace, context) {
    logger.error({ context, trace }, String(message));
  },
  warn(message, context) {
    logger.warn({ context }, String(message));
  },
};
