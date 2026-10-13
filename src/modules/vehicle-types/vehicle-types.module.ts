import { Module } from '@nestjs/common';
import { IMakeCache, MAKE_CACHE } from '../../domain/makes/ports/make.cache';
import { SyncVehicleTypesUseCase } from '../../domain/vehicle-type/use-cases/sync-vehicle-types';
import {
  IVehicleTypeRepository,
  VEHICLE_TYPE_REPOSITORY,
} from '../../domain/vehicle-type/ports/vehicle-type.repository';
import {
  IVehicleTypeCatalog,
  VEHICLE_TYPE_CATALOG,
} from '../../domain/vehicle-type/ports/vehicle-types-catalog';
import { VpicModule } from '../../infrastructure/vpic/vpic.module';

@Module({
  imports: [VpicModule],
  providers: [
    {
      provide: SyncVehicleTypesUseCase,
      useFactory: (
        catalog: IVehicleTypeCatalog,
        repository: IVehicleTypeRepository,
        cache: IMakeCache,
      ) => new SyncVehicleTypesUseCase(catalog, repository, cache),
      inject: [VEHICLE_TYPE_CATALOG, VEHICLE_TYPE_REPOSITORY, MAKE_CACHE],
    },
  ],
  exports: [SyncVehicleTypesUseCase],
})
export class VehicleTypesModule {}
