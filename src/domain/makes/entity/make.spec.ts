import { VehicleType } from '../../vehicle-type/entity/vehicle-type';
import { Make } from './make';

describe('Make', () => {
  it('should throw an error when make id is not a valid string', () => {
    expect(() => new Make('', 'Any')).toThrow('Make ID is required');
    expect(() => new Make('  ', 'Any')).toThrow('Make ID is required');
    expect(() => new Make(null as any, 'Any')).toThrow('Make ID is required');
    expect(() => new Make(undefined as any, 'Any')).toThrow(
      'Make ID is required',
    );
    expect(() => new Make(NaN as any, 'Any')).toThrow('Make ID is required');
    expect(() => new Make({} as any, 'Any')).toThrow('Make ID is required');
  });

  it('should throw an error when make name is not a valid string', () => {
    expect(() => new Make('Any', '  ')).toThrow('Make Name is required');
    expect(() => new Make('Any', null as any)).toThrow('Make Name is required');
    expect(() => new Make('Any', undefined as any)).toThrow(
      'Make Name is required',
    );
    expect(() => new Make('Any', NaN as any)).toThrow('Make Name is required');
    expect(() => new Make('Any', {} as any)).toThrow('Make Name is required');
  });

  it('defaults vehicle types to an empty list', () => {
    expect(new Make('1', 'Tesla').vehicleTypes).toEqual([]);
  });

  it('exposes joined vehicle types', () => {
    const vehicleTypes = [new VehicleType('1', '2', 'Passenger Car')];
    const make = new Make('1', 'Tesla', vehicleTypes);

    expect(make.vehicleTypes).toBe(vehicleTypes);
  });
});
