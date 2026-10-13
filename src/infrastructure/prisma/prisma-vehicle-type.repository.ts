import { Injectable } from '@nestjs/common';
import { Page } from '../../domain/shared/ports/repository';
import { VehicleType } from '../../domain/vehicle-type/entity/vehicle-type';
import { IVehicleTypeRepository } from '../../domain/vehicle-type/ports/vehicle-type.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaVehicleTypeRepository implements IVehicleTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(vehicleType: VehicleType): Promise<VehicleType> {
    const row = await this.prisma.vehicleType.upsert({
      where: {
        makeId_typeId: {
          makeId: Number(vehicleType.makeId),
          typeId: Number(vehicleType.typeId),
        },
      },
      create: {
        makeId: Number(vehicleType.makeId),
        typeId: Number(vehicleType.typeId),
        typeName: vehicleType.typeName,
      },
      update: { typeName: vehicleType.typeName },
    });

    return this.toDomain(row);
  }

  async saveMany(vehicleTypes: VehicleType[]): Promise<void> {
    await this.prisma.$transaction(
      vehicleTypes.map((vehicleType) =>
        this.prisma.vehicleType.upsert({
          where: {
            makeId_typeId: {
              makeId: Number(vehicleType.makeId),
              typeId: Number(vehicleType.typeId),
            },
          },
          create: {
            makeId: Number(vehicleType.makeId),
            typeId: Number(vehicleType.typeId),
            typeName: vehicleType.typeName,
          },
          update: { typeName: vehicleType.typeName },
        }),
      ),
    );
  }

  async getMany(skip: number, take: number): Promise<Page<VehicleType>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vehicleType.findMany({
        skip,
        take,
        orderBy: { typeName: 'asc' },
      }),
      this.prisma.vehicleType.count(),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  private toDomain(row: {
    makeId: number;
    typeId: number;
    typeName: string;
  }): VehicleType {
    return new VehicleType(
      String(row.makeId),
      String(row.typeId),
      row.typeName,
    );
  }
}
