import { Injectable } from '@nestjs/common';
import { Make } from '../../domain/makes/entity/make';
import { IMakeRepository } from '../../domain/makes/ports/make.repository';
import { Page } from '../../domain/shared/ports/repository';
import { VehicleType } from '../../domain/vehicle-type/entity/vehicle-type';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaMakeRepository implements IMakeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(make: Make): Promise<Make> {
    const row = await this.prisma.make.upsert({
      where: { makeId: Number(make.makeId) },
      create: {
        makeId: Number(make.makeId),
        makeName: make.makeName,
      },
      update: { makeName: make.makeName },
    });

    return this.toDomain(row);
  }

  async saveMany(makes: Make[]): Promise<void> {
    await Promise.all(
      makes.map(async (make) => {
        try {
          await this.prisma.make.upsert({
            where: { makeId: Number(make.makeId) },
            create: {
              makeId: Number(make.makeId),
              makeName: make.makeName,
            },
            update: { makeName: make.makeName },
          });
        } catch (error: any) {
          console.info(error?.message || error);
        }
      }),
    );
  }

  async getMany(skip: number, take: number): Promise<Page<Make>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.make.findMany({
        skip,
        take,
        orderBy: { makeName: 'asc' },
        include: {
          vehicleTypes: {
            orderBy: { typeName: 'asc' },
          },
        },
      }),
      this.prisma.make.count(),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  private toDomain(row: {
    makeId: number;
    makeName: string;
    vehicleTypes?: Array<{
      makeId: number;
      typeId: number;
      typeName: string;
    }>;
  }): Make {
    return new Make(
      String(row.makeId),
      row.makeName,
      (row.vehicleTypes ?? []).map(
        (vehicleType) =>
          new VehicleType(
            String(vehicleType.makeId),
            String(vehicleType.typeId),
            vehicleType.typeName,
          ),
      ),
    );
  }
}
