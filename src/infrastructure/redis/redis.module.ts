import { Global, Module } from '@nestjs/common';
import { MAKE_CACHE } from '../../domain/makes/ports/make.cache';
import { RedisMakeCache } from './redis-make.cache';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService, { provide: MAKE_CACHE, useClass: RedisMakeCache }],
  exports: [RedisService, MAKE_CACHE],
})
export class RedisModule {}
