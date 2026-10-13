import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Env } from '../../config';
import { logger } from '../../logger';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(configService: ConfigService<Env, true>) {
    super(configService.get('REDIS_URL', { infer: true }), {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.on('error', (err) => {
      logger.error({ err }, 'unexpected exception');
    });
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
