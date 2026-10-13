import { jest } from '@jest/globals';
import { SyncVehicleTypesUseCase } from '../../vehicle-type/use-cases/sync-vehicle-types';
import { Make } from '../entity/make';
import { IMakeCache } from '../ports/make.cache';
import { IMakeRepository } from '../ports/make.repository';
import { IMakeCatalog } from '../ports/makes-catalog';
import { SyncMakesUseCase } from './sync-makes';

describe('Sync makes', () => {
  let catalog: jest.Mocked<IMakeCatalog>;
  let repository: jest.Mocked<IMakeRepository>;
  let cache: jest.Mocked<IMakeCache>;
  let syncVehicleTypes: {
    execute: jest.MockedFunction<SyncVehicleTypesUseCase['execute']>;
  };
  let useCase: SyncMakesUseCase;

  beforeEach(() => {
    catalog = {
      getAllMakes: jest.fn(),
    };
    repository = {
      getMany: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    };
    cache = {
      getMany: jest.fn(),
      setMany: jest.fn(),
      invalidate: jest.fn(),
    };
    syncVehicleTypes = {
      execute: jest.fn<SyncVehicleTypesUseCase['execute']>(),
    };
    useCase = new SyncMakesUseCase(
      catalog,
      repository,
      cache,
      syncVehicleTypes as unknown as SyncVehicleTypesUseCase,
    );
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  it('saves catalog items as Make entities', async () => {
    catalog.getAllMakes.mockResolvedValue([
      { id: '1', name: 'Tesla' },
      { id: '2', name: 'Ford' },
    ]);

    await useCase.execute();

    expect(repository.saveMany).toHaveBeenCalledTimes(1);
    const saved = repository.saveMany.mock.calls[0][0];
    expect(saved).toHaveLength(2);
    expect(saved[0]).toBeInstanceOf(Make);
    expect(saved[0].makeId).toBe('1');
    expect(saved[0].makeName).toBe('Tesla');
    expect(saved[1].makeId).toBe('2');
    expect(saved[1].makeName).toBe('Ford');
    expect(cache.invalidate).toHaveBeenCalledTimes(1);
  });

  it('saves makes in chunks of 100', async () => {
    catalog.getAllMakes.mockResolvedValue(
      Array.from({ length: 250 }, (_, index) => ({
        id: String(index + 1),
        name: `Make ${index + 1}`,
      })),
    );

    await useCase.execute();

    expect(repository.saveMany).toHaveBeenCalledTimes(3);
    expect(repository.saveMany.mock.calls[0][0]).toHaveLength(100);
    expect(repository.saveMany.mock.calls[1][0]).toHaveLength(100);
    expect(repository.saveMany.mock.calls[2][0]).toHaveLength(50);
  });

  it('syncs vehicle types for each saved make', async () => {
    catalog.getAllMakes.mockResolvedValue([
      { id: '1', name: 'Tesla' },
      { id: '2', name: 'Ford' },
    ]);

    await useCase.execute();

    expect(syncVehicleTypes.execute).toHaveBeenCalledTimes(2);
    expect(syncVehicleTypes.execute).toHaveBeenNthCalledWith(1, '1');
    expect(syncVehicleTypes.execute).toHaveBeenNthCalledWith(2, '2');
  });

  it('does not save when the catalog fails', async () => {
    catalog.getAllMakes.mockRejectedValue(new Error('catalog error'));

    await useCase.execute();

    expect(repository.saveMany).not.toHaveBeenCalled();
    expect(cache.invalidate).not.toHaveBeenCalled();
    expect(syncVehicleTypes.execute).not.toHaveBeenCalled();
  });

  it('does not throw when saveMany fails', async () => {
    catalog.getAllMakes.mockResolvedValue([{ id: '1', name: 'Tesla' }]);
    repository.saveMany.mockRejectedValue(new Error('database error'));

    await expect(useCase.execute()).resolves.toBeUndefined();
    expect(cache.invalidate).not.toHaveBeenCalled();
    expect(syncVehicleTypes.execute).not.toHaveBeenCalled();
  });
});
