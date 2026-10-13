import { Module } from '@nestjs/common';
import { GetMakesUseCase } from '../../domain/makes/use-cases/list-makes';
import { SyncMakesUseCase } from '../../domain/makes/use-cases/sync-makes';
import { SyncVehicleTypesUseCase } from '../../domain/vehicle-type/use-cases/sync-vehicle-types';
import { MakesController } from '../../presentation/makes/makes.controller';
import { MakesResolver } from '../../presentation/makes/makes.resolver';
import {
  IMakeCatalog,
  MAKE_CATALOG,
} from '../../domain/makes/ports/makes-catalog';
import { IMakeCache, MAKE_CACHE } from '../../domain/makes/ports/make.cache';
import {
  IMakeRepository,
  MAKE_REPOSITORY,
} from '../../domain/makes/ports/make.repository';
import { VpicModule } from '../../infrastructure/vpic/vpic.module';
import { VehicleTypesModule } from '../vehicle-types/vehicle-types.module';

@Module({
  imports: [VpicModule, VehicleTypesModule],
  providers: [
    MakesResolver,
    {
      provide: SyncMakesUseCase,
      useFactory: (
        catalog: IMakeCatalog,
        repository: IMakeRepository,
        cache: IMakeCache,
        syncVehicleTypes: SyncVehicleTypesUseCase,
      ) => new SyncMakesUseCase(catalog, repository, cache, syncVehicleTypes),
      inject: [
        MAKE_CATALOG,
        MAKE_REPOSITORY,
        MAKE_CACHE,
        SyncVehicleTypesUseCase,
      ],
    },
    {
      provide: GetMakesUseCase,
      useFactory: (repository: IMakeRepository, cache: IMakeCache) =>
        new GetMakesUseCase(repository, cache),
      inject: [MAKE_REPOSITORY, MAKE_CACHE],
    },
  ],
  controllers: [MakesController],
})
export class MakesModule {}
