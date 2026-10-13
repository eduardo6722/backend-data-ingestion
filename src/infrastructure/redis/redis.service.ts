import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { logger } from '../../logger';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    super(configService.getOrThrow<string>('REDIS_URL'), {
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
