import { IRepository, Page } from '../../shared/ports/repository';
import { VehicleType } from '../entity/vehicle-type';

export const VEHICLE_TYPE_REPOSITORY = Symbol('VEHICLE_TYPE_REPOSITORY');

export interface IVehicleTypeRepository extends Pick<
  IRepository<VehicleType, string>,
  'save'
> {
  getMany(skip: number, take: number): Promise<Page<VehicleType>>;
  saveMany(vehicleTypes: VehicleType[]): Promise<void>;
}
