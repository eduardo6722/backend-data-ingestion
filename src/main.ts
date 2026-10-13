import { readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';

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
  const app = await NestFactory.create(AppModule);

  if (isProduction) {
    app.enableShutdownHooks();
  }

  const config = app.get(ConfigService);
  const port = Number(config.get('PORT') ?? 8080);

  if (!isProduction) {
    killOtherListeners(port);
  }

  await app.listen(port);
}

void bootstrap();
