import { VehicleType } from '../../vehicle-type/entity/vehicle-type';
import { assertValidString } from '../../shared/utils/assert-non-empty-string';

export class Make {
  private _makeId: string;
  private _makeName: string;
  private _vehicleTypes: VehicleType[];

  constructor(
    makeId: string,
    makeName: string,
    vehicleTypes: VehicleType[] = [],
  ) {
    this._makeId = makeId;
    this._makeName = makeName;
    this._vehicleTypes = vehicleTypes;
    this.validate();
  }

  private validate() {
    if (!assertValidString(this._makeId)) {
      throw new Error('Make ID is required');
    }
    if (!assertValidString(this._makeName)) {
      throw new Error('Make Name is required');
    }
  }

  get makeId() {
    return this._makeId;
  }

  get makeName() {
    return this._makeName;
  }

  get vehicleTypes() {
    return this._vehicleTypes;
  }
}
