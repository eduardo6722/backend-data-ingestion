import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    super(configService.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.on('error', (error) => {
      this.logger.error(error);
    });
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
