import { Injectable, Logger } from '@nestjs/common';
import { HttpClient } from '@nestjs/http-client';
import { XMLParser } from 'fast-xml-parser';
import { IMakeCatalog } from '../../domain/makes/ports/makes-catalog';
import { IVehicleTypeCatalog } from '../../domain/vehicle-type/ports/vehicle-types-catalog';

@Injectable()
export class VpicService implements IMakeCatalog, IVehicleTypeCatalog {
  private logger: Logger = new Logger(VpicService.name);

  constructor(private readonly http: HttpClient) {}

  async getAllMakes() {
    try {
      const response = await this.http.get(
        '/api/vehicles/getallmakes?format=XML',
        {
          responseType: 'text',
        },
      );

      if (!response) return null;

      const parser = new XMLParser({
        ignoreAttributes: false,
        parseTagValue: true,
      });

      const parsed = parser.parse(response.data);

      return parsed.Response.Results.AllVehicleMakes.map(
        (item: { Make_ID: number; Make_Name: string }) => ({
          id: String(item.Make_ID),
          name: item.Make_Name,
        }),
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getVehicleTypesForMakeId(makeId: string) {
    try {
      const response = await this.http.get(
        `/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=XML`,
        {
          responseType: 'text',
        },
      );

      if (!response) return [];

      const parser = new XMLParser({
        ignoreAttributes: false,
        parseTagValue: true,
      });

      const parsed = parser.parse(response.data);
      const results = parsed.Response.Results.VehicleTypesForMakeIds;
      const items = Array.isArray(results) ? results : results ? [results] : [];

      return items.map(
        (item: { VehicleTypeId: number; VehicleTypeName: string }) => ({
          id: String(item.VehicleTypeId),
          name: item.VehicleTypeName,
        }),
      );
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }
}
