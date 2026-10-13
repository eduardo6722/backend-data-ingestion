import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientModule } from '@nestjs/http-client';
import { MAKE_CATALOG } from '../../domain/makes/ports/makes-catalog';
import { VEHICLE_TYPE_CATALOG } from '../../domain/vehicle-type/ports/vehicle-types-catalog';
import { VpicService } from './vpic.service';

@Module({
  imports: [
    HttpClientModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseUrl: config.getOrThrow<string>('VPIC_BASE_URL'),
        timeout: '20s',
      }),
    }),
  ],
  providers: [
    VpicService,
    { provide: MAKE_CATALOG, useExisting: VpicService },
    { provide: VEHICLE_TYPE_CATALOG, useExisting: VpicService },
  ],
  exports: [MAKE_CATALOG, VEHICLE_TYPE_CATALOG],
})
export class VpicModule {}
