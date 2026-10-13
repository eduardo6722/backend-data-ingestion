import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Make } from '../../domain/makes/entity/make';
import { VehicleType } from '../../domain/vehicle-type/entity/vehicle-type';
import { RedisMakeCache } from './redis-make.cache';
import { RedisService } from './redis.service';

describe('RedisMakeCache', () => {
  let redis: {
    get: jest.Mock<(key: string) => Promise<string | null>>;
    set: jest.Mock<
      (
        key: string,
        value: string,
        expiryMode: 'EX',
        ttl: number,
      ) => Promise<'OK'>
    >;
    incr: jest.Mock<(key: string) => Promise<number>>;
  };
  let cache: RedisMakeCache;

  beforeEach(() => {
    redis = {
      get: jest.fn<(key: string) => Promise<string | null>>(),
      set: jest.fn<
        (
          key: string,
          value: string,
          expiryMode: 'EX',
          ttl: number,
        ) => Promise<'OK'>
      >(),
      incr: jest.fn<(key: string) => Promise<number>>(),
    };
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    cache = new RedisMakeCache(
      redis as unknown as RedisService,
      { get: () => '60' } as unknown as ConfigService,
    );
  });

  it('returns null on a cache miss', async () => {
    redis.get.mockResolvedValue(null);

    await expect(cache.getMany(0, 10)).resolves.toBeNull();
    expect(redis.get).toHaveBeenCalledWith('makes:0:page:0:10');
  });

  it('rehydrates cached makes as domain entities', async () => {
    redis.get.mockResolvedValueOnce('3').mockResolvedValueOnce(
      JSON.stringify({
        items: [
          {
            makeId: '1',
            makeName: 'Tesla',
            vehicleTypes: [
              { makeId: '1', typeId: '2', typeName: 'Passenger Car' },
            ],
          },
        ],
        total: 1,
      }),
    );

    const result = await cache.getMany(0, 10);

    expect(result?.total).toBe(1);
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toBeInstanceOf(Make);
    expect(result?.items[0].makeId).toBe('1');
    expect(result?.items[0].makeName).toBe('Tesla');
    expect(result?.items[0].vehicleTypes[0]).toBeInstanceOf(VehicleType);
    expect(result?.items[0].vehicleTypes[0].typeId).toBe('2');
    expect(result?.items[0].vehicleTypes[0].typeName).toBe('Passenger Car');
    expect(redis.get).toHaveBeenCalledWith('makes:3:page:0:10');
  });

  it('stores a serialized page with ttl', async () => {
    redis.get.mockResolvedValue('1');
    redis.set.mockResolvedValue('OK');

    await cache.setMany(10, 20, {
      items: [
        new Make('1', 'Tesla', [new VehicleType('1', '2', 'Passenger Car')]),
      ],
      total: 1,
    });

    expect(redis.set).toHaveBeenCalledWith(
      'makes:1:page:10:20',
      JSON.stringify({
        items: [
          {
            makeId: '1',
            makeName: 'Tesla',
            vehicleTypes: [
              { makeId: '1', typeId: '2', typeName: 'Passenger Car' },
            ],
          },
        ],
        total: 1,
      }),
      'EX',
      60,
    );
  });

  it('invalidates by incrementing the version', async () => {
    redis.incr.mockResolvedValue(2);

    await cache.invalidate();

    expect(redis.incr).toHaveBeenCalledWith('makes:version');
  });

  it('does not throw when redis fails', async () => {
    redis.get.mockRejectedValue(new Error('redis down'));
    redis.set.mockRejectedValue(new Error('redis down'));
    redis.incr.mockRejectedValue(new Error('redis down'));

    await expect(cache.getMany(0, 10)).resolves.toBeNull();
    await expect(
      cache.setMany(0, 10, { items: [], total: 0 }),
    ).resolves.toBeUndefined();
    await expect(cache.invalidate()).resolves.toBeUndefined();
  });
});
