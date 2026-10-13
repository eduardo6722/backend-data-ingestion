import { jest } from '@jest/globals';
import { IMakeCache } from '../../makes/ports/make.cache';
import { VehicleType } from '../entity/vehicle-type';
import { IVehicleTypeRepository } from '../ports/vehicle-type.repository';
import { IVehicleTypeCatalog } from '../ports/vehicle-types-catalog';
import { SyncVehicleTypesUseCase } from './sync-vehicle-types';

describe('Sync vehicle types', () => {
  let catalog: jest.Mocked<IVehicleTypeCatalog>;
  let repository: jest.Mocked<IVehicleTypeRepository>;
  let cache: jest.Mocked<IMakeCache>;
  let useCase: SyncVehicleTypesUseCase;

  beforeEach(() => {
    catalog = {
      getVehicleTypesForMakeId: jest.fn(),
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
    useCase = new SyncVehicleTypesUseCase(catalog, repository, cache);
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  it('saves catalog items as VehicleType entities', async () => {
    catalog.getVehicleTypesForMakeId.mockResolvedValue([
      { id: '2', name: 'Passenger Car' },
      { id: '7', name: 'Multipurpose Passenger Vehicle (MPV)' },
    ]);

    await useCase.execute('440');

    expect(catalog.getVehicleTypesForMakeId).toHaveBeenCalledWith('440');
    expect(repository.saveMany).toHaveBeenCalledTimes(1);
    const saved = repository.saveMany.mock.calls[0][0];
    expect(saved).toHaveLength(2);
    expect(saved[0]).toBeInstanceOf(VehicleType);
    expect(saved[0].makeId).toBe('440');
    expect(saved[0].typeId).toBe('2');
    expect(saved[0].typeName).toBe('Passenger Car');
    expect(saved[1].makeId).toBe('440');
    expect(saved[1].typeId).toBe('7');
    expect(saved[1].typeName).toBe('Multipurpose Passenger Vehicle (MPV)');
    expect(cache.invalidate).toHaveBeenCalledTimes(1);
  });

  it('does not save when the catalog fails', async () => {
    catalog.getVehicleTypesForMakeId.mockRejectedValue(
      new Error('catalog error'),
    );

    await useCase.execute('440');

    expect(repository.saveMany).not.toHaveBeenCalled();
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it('does not throw when saveMany fails', async () => {
    catalog.getVehicleTypesForMakeId.mockResolvedValue([
      { id: '2', name: 'Passenger Car' },
    ]);
    repository.saveMany.mockRejectedValue(new Error('database error'));

    await expect(useCase.execute('440')).resolves.toBeUndefined();
    expect(cache.invalidate).not.toHaveBeenCalled();
  });
});
