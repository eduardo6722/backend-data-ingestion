import { Injectable } from '@nestjs/common';
import { HttpClient } from '@nestjs/http-client';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { IMakeCatalog } from '../../domain/makes/ports/makes-catalog';
import { IVehicleTypeCatalog } from '../../domain/vehicle-type/ports/vehicle-types-catalog';
import { logger } from '../../logger';

@Injectable()
export class VpicService implements IMakeCatalog, IVehicleTypeCatalog {
  private readonly xmlParser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: true,
  });

  constructor(private readonly http: HttpClient) {}

  async getAllMakes() {
    const url = '/api/vehicles/getallmakes?format=XML';
    const xml = await this.fetchXml(url);
    if (!xml) return [];

    const parsed = this.parseXml(xml, url);
    if (!parsed) return [];

    try {
      const makes = parsed?.Response?.Results?.AllVehicleMakes;
      const items = Array.isArray(makes) ? makes : makes ? [makes] : [];

      return items.map((item: { Make_ID: number; Make_Name: string }) => ({
        id: String(item.Make_ID),
        name: item.Make_Name,
      }));
    } catch (err) {
      logger.error({ err, url }, 'Transformation error');
      return [];
    }
  }

  async getVehicleTypesForMakeId(makeId: string) {
    const url = `/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=XML`;
    const xml = await this.fetchXml(url);
    if (!xml) return [];

    const parsed = this.parseXml(xml, url);
    if (!parsed) return [];

    try {
      const results = parsed?.Response?.Results?.VehicleTypesForMakeIds;
      const items = Array.isArray(results) ? results : results ? [results] : [];

      return items.map(
        (item: { VehicleTypeId: number; VehicleTypeName: string }) => ({
          id: String(item.VehicleTypeId),
          name: item.VehicleTypeName,
        }),
      );
    } catch (err) {
      logger.error({ err, makeId, url }, 'Transformation error');
      return [];
    }
  }

  private async fetchXml(url: string): Promise<string | null> {
    try {
      const response = await this.http.get(url, {
        responseType: 'text',
      });

      if (!response?.data) {
        logger.warn({ url }, 'API request failed');
        return null;
      }

      return response.data;
    } catch (err) {
      logger.error({ err, url }, 'API request failed');
      return null;
    }
  }

  private parseXml(xml: string, url: string) {
    try {
      const valid = XMLValidator.validate(xml);
      if (valid !== true) {
        logger.error({ err: valid, url }, 'XML parsing error');
        return null;
      }

      return this.xmlParser.parse(xml);
    } catch (err) {
      logger.error({ err, url }, 'XML parsing error');
      return null;
    }
  }
}
