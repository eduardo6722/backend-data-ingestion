import { jest } from '@jest/globals';
import { VehicleType } from '../entity/vehicle-type';
import { IVehicleTypeRepository } from '../ports/vehicle-type.repository';
import { GetVehicleTypesUseCase } from './list-vehicle-types';

describe('List vehicle types', () => {
  let repository: jest.Mocked<IVehicleTypeRepository>;
  let useCase: GetVehicleTypesUseCase;

  beforeEach(() => {
    repository = {
      getMany: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    };

    useCase = new GetVehicleTypesUseCase(repository);
  });

  it('Should return vehicle type items', async () => {
    const vehicleTypes: VehicleType[] = [
      new VehicleType('440', '2', 'Passenger Car'),
      new VehicleType('440', '7', 'Multipurpose Passenger Vehicle (MPV)'),
    ];

    repository.getMany.mockResolvedValue({
      items: vehicleTypes,
      total: vehicleTypes.length,
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
});
