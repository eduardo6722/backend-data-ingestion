import { logger } from '../../../logger';
import { IMakeCache } from '../../makes/ports/make.cache';
import { VehicleType } from '../entity/vehicle-type';
import { IVehicleTypeRepository } from '../ports/vehicle-type.repository';
import { IVehicleTypeCatalog } from '../ports/vehicle-types-catalog';

export class SyncVehicleTypesUseCase {
  constructor(
    private readonly catalog: IVehicleTypeCatalog,
    private readonly repository: IVehicleTypeRepository,
    private readonly cache: IMakeCache,
  ) {}

  async execute(makeId: string): Promise<void> {
    let vehicleTypes;
    try {
      vehicleTypes = await this.catalog.getVehicleTypesForMakeId(makeId);
    } catch (err) {
      logger.error({ err, makeId }, 'API request failed');
      return;
    }

    if (!vehicleTypes?.length) {
      return;
    }

    const parsedVehicleTypes: VehicleType[] = [];
    for (const vehicleType of vehicleTypes) {
      try {
        parsedVehicleTypes.push(
          new VehicleType(makeId, vehicleType.id, vehicleType.name),
        );
      } catch (err) {
        logger.error({ err, makeId, vehicleType }, 'Transformation error');
      }
    }

    if (!parsedVehicleTypes.length) {
      return;
    }

    try {
      await this.repository.saveMany(parsedVehicleTypes);
    } catch (err) {
      logger.error({ err, makeId }, 'Datastore insertion error');
      return;
    }

    await this.cache.invalidate();
  }
}
