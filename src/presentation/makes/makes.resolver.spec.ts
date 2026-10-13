import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Make } from '../../domain/makes/entity/make';
import { GetMakesUseCase } from '../../domain/makes/use-cases/list-makes';
import { VehicleType } from '../../domain/vehicle-type/entity/vehicle-type';
import { MakesResolver } from './makes.resolver';

describe('MakesResolver', () => {
  let resolver: MakesResolver;
  let getMakesUseCase: {
    execute: jest.MockedFunction<GetMakesUseCase['execute']>;
  };

  beforeEach(async () => {
    getMakesUseCase = {
      execute: jest.fn<GetMakesUseCase['execute']>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakesResolver,
        { provide: GetMakesUseCase, useValue: getMakesUseCase },
      ],
    }).compile();

    resolver = module.get(MakesResolver);
  });

  it('paginates with default skip 0 and take 10', async () => {
    getMakesUseCase.execute.mockResolvedValue({ items: [], total: 0 });

    await resolver.getMakes(0, 10);

    expect(getMakesUseCase.execute).toHaveBeenCalledWith({ skip: 0, take: 10 });
  });

  it('forwards skip and take to the use case', async () => {
    getMakesUseCase.execute.mockResolvedValue({ items: [], total: 0 });

    await resolver.getMakes(20, 5);

    expect(getMakesUseCase.execute).toHaveBeenCalledWith({ skip: 20, take: 5 });
  });

  it('returns makes joined with vehicle types', async () => {
    getMakesUseCase.execute.mockResolvedValue({
      items: [
        new Make('440', 'ASTON MARTIN', [
          new VehicleType('440', '2', 'Passenger Car'),
          new VehicleType('440', '7', 'Multipurpose Passenger Vehicle (MPV)'),
        ]),
      ],
      total: 1,
    });

    await expect(resolver.getMakes(0, 10)).resolves.toEqual([
      {
        makeId: '440',
        makeName: 'ASTON MARTIN',
        vehicleTypes: [
          { typeId: '2', typeName: 'Passenger Car' },
          {
            typeId: '7',
            typeName: 'Multipurpose Passenger Vehicle (MPV)',
          },
        ],
      },
    ]);
  });

  it('returns an empty list when the use case returns null', async () => {
    getMakesUseCase.execute.mockResolvedValue(null);

    await expect(resolver.getMakes(0, 10)).resolves.toEqual([]);
  });
});
