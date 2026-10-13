import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Make } from '../../domain/makes/entity/make';
import { IMakeCache } from '../../domain/makes/ports/make.cache';
import { Page } from '../../domain/shared/ports/repository';
import { VehicleType } from '../../domain/vehicle-type/entity/vehicle-type';
import { logger } from '../../logger';
import { RedisService } from './redis.service';

type CachedVehicleType = {
  makeId: string;
  typeId: string;
  typeName: string;
};

type CachedMake = {
  makeId: string;
  makeName: string;
  vehicleTypes?: CachedVehicleType[];
};

type CachedMakePage = {
  items: CachedMake[];
  total: number;
};

@Injectable()
export class RedisMakeCache implements IMakeCache {
  private readonly ttlSeconds: number;
  private readonly versionKey = 'makes:version';

  constructor(
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    const ttl = Number(configService.get('MAKES_CACHE_TTL_SECONDS'));
    this.ttlSeconds = Number.isFinite(ttl) && ttl > 0 ? ttl : 300;
  }

  async getMany(skip: number, take: number): Promise<Page<Make> | null> {
    try {
      const version = await this.currentVersion();
      const raw = await this.redis.get(this.pageKey(version, skip, take));
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as CachedMakePage;

      return {
        items: parsed.items.map(
          (item) =>
            new Make(
              item.makeId,
              item.makeName,
              (item.vehicleTypes ?? []).map(
                (vehicleType) =>
                  new VehicleType(
                    vehicleType.makeId,
                    vehicleType.typeId,
                    vehicleType.typeName,
                  ),
              ),
            ),
        ),
        total: parsed.total,
      };
    } catch (err) {
      logger.error({ err }, 'unexpected exception');
      return null;
    }
  }

  async setMany(skip: number, take: number, page: Page<Make>): Promise<void> {
    try {
      const version = await this.currentVersion();
      const payload: CachedMakePage = {
        items: page.items.map((make) => ({
          makeId: make.makeId,
          makeName: make.makeName,
          vehicleTypes: make.vehicleTypes.map((vehicleType) => ({
            makeId: vehicleType.makeId,
            typeId: vehicleType.typeId,
            typeName: vehicleType.typeName,
          })),
        })),
        total: page.total,
      };

      await this.redis.set(
        this.pageKey(version, skip, take),
        JSON.stringify(payload),
        'EX',
        this.ttlSeconds,
      );
    } catch (err) {
      logger.error({ err }, 'unexpected exception');
    }
  }

  async invalidate(): Promise<void> {
    try {
      await this.redis.incr(this.versionKey);
    } catch (err) {
      logger.error({ err }, 'unexpected exception');
    }
  }

  private async currentVersion(): Promise<string> {
    const version = await this.redis.get(this.versionKey);
    return version ?? '0';
  }

  private pageKey(version: string, skip: number, take: number): string {
    return `makes:${version}:page:${skip}:${take}`;
  }
}
