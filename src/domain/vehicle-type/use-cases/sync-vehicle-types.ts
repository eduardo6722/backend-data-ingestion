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
    try {
      const vehicleTypes = await this.catalog.getVehicleTypesForMakeId(makeId);

      const parsedVehicleTypes = await Promise.all(
        vehicleTypes.map(
          (vehicleType) =>
            new VehicleType(makeId, vehicleType.id, vehicleType.name),
        ),
      );

      await this.repository.saveMany(parsedVehicleTypes);
      await this.cache.invalidate();
    } catch (error: any) {
      console.info(error?.message || error);
    }
  }
}
