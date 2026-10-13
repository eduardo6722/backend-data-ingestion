export const VEHICLE_TYPE_CATALOG = Symbol('VEHICLE_TYPE_CATALOG');

export type VehicleTypeCatalogItemType = {
  id: string;
  name: string;
};

export interface IVehicleTypeCatalog {
  getVehicleTypesForMakeId(
    makeId: string,
  ): Promise<VehicleTypeCatalogItemType[]>;
}
