import { jest } from '@jest/globals';
import { VehicleType } from '../../vehicle-type/entity/vehicle-type';
import { Make } from '../entity/make';
import { IMakeCache } from '../ports/make.cache';
import { IMakeRepository } from '../ports/make.repository';
import { GetMakesUseCase } from './list-makes';

describe('List makes', () => {
  let repository: jest.Mocked<IMakeRepository>;
  let cache: jest.Mocked<IMakeCache>;
  let useCase: GetMakesUseCase;

  beforeEach(() => {
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

    useCase = new GetMakesUseCase(repository, cache);
  });

  it('Should return makes items', async () => {
    const makes: Make[] = [new Make('1', 'make1'), new Make('2', 'make2')];

    repository.getMany.mockResolvedValue({
      items: makes,
      total: makes.length,
    });

    const result = await useCase.execute();

    expect(result?.items).toHaveLength(2);
    expect(result?.total).toBe(2);
  });

  it('should return null if repository throws an error', async () => {
    repository.getMany.mockRejectedValue(new Error('Database error'));
    const result = await useCase.execute();

    expect(result).toBeNull();
  });

  it('should call pagination with default skip 0 and take 10', async () => {
    await useCase.execute();
    expect(repository.getMany).toHaveBeenCalledTimes(1);
    expect(repository.getMany).toHaveBeenCalledWith(0, 10);
  });

  it('should call pagination with correct skip and take params', async () => {
    const params = { skip: 10, take: 20 };
    await useCase.execute(params);
    expect(repository.getMany).toHaveBeenCalledTimes(1);
    expect(repository.getMany).toHaveBeenCalledWith(params.skip, params.take);
  });

  it('should return cached makes without hitting the repository', async () => {
    const cached = {
      items: [new Make('1', 'Tesla')],
      total: 1,
    };
    cache.getMany.mockResolvedValue(cached);

    const result = await useCase.execute({ skip: 0, take: 10 });

    expect(result).toBe(cached);
    expect(repository.getMany).not.toHaveBeenCalled();
    expect(cache.setMany).not.toHaveBeenCalled();
  });

  it('should cache repository results on a miss', async () => {
    const page = {
      items: [new Make('1', 'Tesla')],
      total: 1,
    };
    cache.getMany.mockResolvedValue(null);
    repository.getMany.mockResolvedValue(page);

    const result = await useCase.execute({ skip: 5, take: 15 });

    expect(result).toBe(page);
    expect(cache.setMany).toHaveBeenCalledWith(5, 15, page);
  });

  it('returns makes with joined vehicle types', async () => {
    const page = {
      items: [
        new Make('440', 'ASTON MARTIN', [
          new VehicleType('440', '2', 'Passenger Car'),
        ]),
      ],
      total: 1,
    };
    cache.getMany.mockResolvedValue(null);
    repository.getMany.mockResolvedValue(page);

    const result = await useCase.execute();

    expect(result?.items[0].vehicleTypes).toHaveLength(1);
    expect(result?.items[0].vehicleTypes[0].typeId).toBe('2');
    expect(result?.items[0].vehicleTypes[0].typeName).toBe('Passenger Car');
  });
});
