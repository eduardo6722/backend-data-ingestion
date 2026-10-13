import { assertValidString } from '../../shared/utils/assert-non-empty-string';

export class VehicleType {
  private _makeId: string;
  private _typeId: string;
  private _typeName: string;

  constructor(makeId: string, typeId: string, typeName: string) {
    this._makeId = makeId;
    this._typeId = typeId;
    this._typeName = typeName;
    this.validate();
  }

  private validate() {
    if (!assertValidString(this._makeId)) {
      throw new Error('Make ID is required');
    }

    if (!assertValidString(this._typeId)) {
      throw new Error('Type ID is required');
    }

    if (!assertValidString(this._typeName)) {
      throw new Error('Type Name is required');
    }
  }

  get makeId() {
    return this._makeId;
  }

  get typeId() {
    return this._typeId;
  }

  get typeName() {
    return this._typeName;
  }
}
