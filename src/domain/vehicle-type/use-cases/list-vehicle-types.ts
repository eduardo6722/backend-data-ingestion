import { logger } from '../../../logger';
import { Page } from '../../shared/ports/repository';
import { VehicleType } from '../entity/vehicle-type';
import { IVehicleTypeRepository } from '../ports/vehicle-type.repository';

type ExecuteParams = {
  skip: number;
  take: number;
};

export class GetVehicleTypesUseCase {
  constructor(private readonly repository: IVehicleTypeRepository) {}

  async execute(params?: ExecuteParams): Promise<Page<VehicleType> | null> {
    try {
      const skip = params?.skip || 0;
      const take = params?.take || 10;

      const result = await this.repository.getMany(skip, take);

      return result;
    } catch (err) {
      logger.error({ err }, 'unexpected exception');
      return null;
    }
  }
}
