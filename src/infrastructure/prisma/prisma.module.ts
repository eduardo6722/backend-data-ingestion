import { Global, Module } from '@nestjs/common';
import { MAKE_REPOSITORY } from '../../domain/makes/ports/make.repository';
import { VEHICLE_TYPE_REPOSITORY } from '../../domain/vehicle-type/ports/vehicle-type.repository';
import { PrismaMakeRepository } from './prisma-make.repository';
import { PrismaVehicleTypeRepository } from './prisma-vehicle-type.repository';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: MAKE_REPOSITORY, useClass: PrismaMakeRepository },
    {
      provide: VEHICLE_TYPE_REPOSITORY,
      useClass: PrismaVehicleTypeRepository,
    },
  ],
  exports: [PrismaService, MAKE_REPOSITORY, VEHICLE_TYPE_REPOSITORY],
})
export class PrismaModule {}
