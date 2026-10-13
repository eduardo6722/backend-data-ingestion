import { Test, TestingModule } from '@nestjs/testing';
import { MakesController } from './makes.controller';
import { SyncMakesUseCase } from '../../domain/makes/use-cases/sync-makes';

describe('MakesController', () => {
  let controller: MakesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MakesController],
      providers: [
        {
          provide: SyncMakesUseCase,
          useValue: { execute: async () => undefined },
        },
      ],
    }).compile();

    controller = module.get(MakesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
