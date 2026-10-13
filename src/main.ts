import { readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { logger, nestLogger } from './logger';
import { AppModule } from './modules/app/app.module';
import { UnexpectedExceptionFilter } from './unexpected-exception.filter';

const isProduction = process.env.NODE_ENV === 'production';

function killOtherListeners(port: number) {
  const hexPort = port.toString(16).toUpperCase().padStart(4, '0');
  const inodes = new Set<string>();

  for (const table of ['/proc/net/tcp', '/proc/net/tcp6']) {
    let body = '';
    try {
      body = readFileSync(table, 'utf8');
    } catch {
      continue;
    }

    for (const line of body.split('\n').slice(1)) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 10 || cols[3] !== '0A') continue;
      const localPort = cols[1]?.split(':')[1]?.toUpperCase();
      if (localPort === hexPort) inodes.add(cols[9]);
    }
  }

  if (inodes.size === 0) return;

  for (const pid of readdirSync('/proc')) {
    if (!/^\d+$/.test(pid) || Number(pid) === process.pid) continue;

    let fds: string[] = [];
    try {
      fds = readdirSync(`/proc/${pid}/fd`);
    } catch {
      continue;
    }

    const holdsPort = fds.some((fd) => {
      try {
        const target = readlinkSync(`/proc/${pid}/fd/${fd}`);
        const inode = /^socket:\[(\d+)\]$/.exec(target)?.[1];
        return inode != null && inodes.has(inode);
      } catch {
        return false;
      }
    });

    if (holdsPort) {
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch {
        // already gone
      }
    }
  }
}

async function bootstrap() {
  logger.info('starting app');

  const app = await NestFactory.create(AppModule, { logger: nestLogger });
  app.useGlobalFilters(new UnexpectedExceptionFilter());
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = Number(config.get('PORT') ?? 8080);

  if (!isProduction) {
    killOtherListeners(port);
  }

  await app.listen(port);
  logger.info({ port }, 'app started');
}

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'unexpected exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unexpected exception');
});

process.on('SIGTERM', () => {
  logger.info({ signal: 'SIGTERM' }, 'shutting down');
});

process.on('SIGINT', () => {
  logger.info({ signal: 'SIGINT' }, 'shutting down');
});

void bootstrap().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
