import { jest } from '@jest/globals';
import { HttpClient } from '@nestjs/http-client';
import { Test, TestingModule } from '@nestjs/testing';
import { logger } from '../../logger';
import { VpicService } from './vpic.service';

const MAKES_XML = `
<Response>
  <Results>
    <AllVehicleMakes>
      <Make_ID>440</Make_ID>
      <Make_Name>ASTON MARTIN</Make_Name>
    </AllVehicleMakes>
    <AllVehicleMakes>
      <Make_ID>441</Make_ID>
      <Make_Name>TESLA</Make_Name>
    </AllVehicleMakes>
  </Results>
</Response>
`;

const VEHICLE_TYPES_XML = `
<Response>
  <Results>
    <VehicleTypesForMakeIds>
      <VehicleTypeId>2</VehicleTypeId>
      <VehicleTypeName>Passenger Car</VehicleTypeName>
    </VehicleTypesForMakeIds>
    <VehicleTypesForMakeIds>
      <VehicleTypeId>7</VehicleTypeId>
      <VehicleTypeName>Multipurpose Passenger Vehicle (MPV)</VehicleTypeName>
    </VehicleTypesForMakeIds>
  </Results>
</Response>
`;

type HttpGet = (
  url: string,
  options?: { responseType: string },
) => Promise<{ data: string } | null>;

describe('VpicService', () => {
  let service: VpicService;
  const http = {
    get: jest.fn<HttpGet>(),
  };

  beforeEach(async () => {
    http.get.mockReset();
    jest.spyOn(logger, 'error').mockImplementation(() => undefined as never);
    jest.spyOn(logger, 'warn').mockImplementation(() => undefined as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [VpicService, { provide: HttpClient, useValue: http }],
    }).compile();

    service = module.get(VpicService);
  });

  it('maps XML makes to catalog items with string ids', async () => {
    http.get.mockResolvedValue({ data: MAKES_XML });

    const result = await service.getAllMakes();

    expect(result).toEqual([
      { id: '440', name: 'ASTON MARTIN' },
      { id: '441', name: 'TESLA' },
    ]);
  });

  it('requests getallmakes as XML text', async () => {
    http.get.mockResolvedValue({ data: MAKES_XML });

    await service.getAllMakes();

    expect(http.get).toHaveBeenCalledWith(
      '/api/vehicles/getallmakes?format=XML',
      { responseType: 'text' },
    );
  });

  it('returns an empty list when the HTTP client returns no response', async () => {
    http.get.mockResolvedValue(null);

    await expect(service.getAllMakes()).resolves.toEqual([]);
  });

  it('does not throw when the HTTP request fails', async () => {
    http.get.mockRejectedValue(new Error('network error'));

    await expect(service.getAllMakes()).resolves.toEqual([]);
  });

  it('does not throw when XML is invalid', async () => {
    http.get.mockResolvedValue({ data: '<not-valid-xml' });

    await expect(service.getAllMakes()).resolves.toEqual([]);
  });

  it('returns an empty list when XML has no makes', async () => {
    http.get.mockResolvedValue({
      data: '<Response><Results></Results></Response>',
    });

    await expect(service.getAllMakes()).resolves.toEqual([]);
  });

  it('maps XML vehicle types to catalog items with string ids', async () => {
    http.get.mockResolvedValue({ data: VEHICLE_TYPES_XML });

    const result = await service.getVehicleTypesForMakeId('440');

    expect(result).toEqual([
      { id: '2', name: 'Passenger Car' },
      { id: '7', name: 'Multipurpose Passenger Vehicle (MPV)' },
    ]);
  });

  it('requests GetVehicleTypesForMakeId as XML text', async () => {
    http.get.mockResolvedValue({ data: VEHICLE_TYPES_XML });

    await service.getVehicleTypesForMakeId('440');

    expect(http.get).toHaveBeenCalledWith(
      '/api/vehicles/GetVehicleTypesForMakeId/440?format=XML',
      { responseType: 'text' },
    );
  });

  it('returns an empty list when the vehicle types HTTP client returns no response', async () => {
    http.get.mockResolvedValue(null);

    await expect(service.getVehicleTypesForMakeId('440')).resolves.toEqual([]);
  });

  it('does not throw when the vehicle types HTTP request fails', async () => {
    http.get.mockRejectedValue(new Error('network error'));

    await expect(service.getVehicleTypesForMakeId('440')).resolves.toEqual([]);
  });

  it('does not throw when vehicle types XML is invalid', async () => {
    http.get.mockResolvedValue({ data: '<not-valid-xml' });

    await expect(service.getVehicleTypesForMakeId('440')).resolves.toEqual([]);
  });
});
