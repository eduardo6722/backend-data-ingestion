import { VehicleType } from './vehicle-type';

describe('VehicleType', () => {
  it('should throw an error when VehicleType id is not a valid string', () => {
    expect(() => new VehicleType('Any', '', 'Any')).toThrow(
      'Type ID is required',
    );
    expect(() => new VehicleType('Any', '  ', 'Any')).toThrow(
      'Type ID is required',
    );
    expect(() => new VehicleType('Any', null as any, 'Any')).toThrow(
      'Type ID is required',
    );
    expect(() => new VehicleType('Any', undefined as any, 'Any')).toThrow(
      'Type ID is required',
    );
    expect(() => new VehicleType('Any', {} as any, 'Any')).toThrow(
      'Type ID is required',
    );
  });

  it('should throw an error when VehicleType name is not a valid string', () => {
    expect(() => new VehicleType('Any', 'Any', '')).toThrow(
      'Type Name is required',
    );
    expect(() => new VehicleType('Any', 'Any', '  ')).toThrow(
      'Type Name is required',
    );
    expect(() => new VehicleType('Any', 'Any', null as any)).toThrow(
      'Type Name is required',
    );
    expect(() => new VehicleType('Any', 'Any', undefined as any)).toThrow(
      'Type Name is required',
    );
    expect(() => new VehicleType('Any', 'Any', {} as any)).toThrow(
      'Type Name is required',
    );
  });
});
