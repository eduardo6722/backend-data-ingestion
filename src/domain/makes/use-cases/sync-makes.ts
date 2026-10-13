import { SyncVehicleTypesUseCase } from '../../vehicle-type/use-cases/sync-vehicle-types';
import { Make } from '../entity/make';
import { IMakeCache } from '../ports/make.cache';
import { IMakeRepository } from '../ports/make.repository';
import { IMakeCatalog } from '../ports/makes-catalog';

export class SyncMakesUseCase {
  private chunkSize: number = 100;

  constructor(
    private readonly catalog: IMakeCatalog,
    private readonly repository: IMakeRepository,
    private readonly cache: IMakeCache,
    private readonly syncVehicleTypes: SyncVehicleTypesUseCase,
  ) {}

  async execute(): Promise<void> {
    try {
      const makes = await this.catalog.getAllMakes();

      const parsedMakes = await Promise.all(
        makes.map((make) => new Make(String(make.id), String(make.name))),
      );

      for (let i = 0; i < parsedMakes.length; i += this.chunkSize) {
        const chunk = parsedMakes.slice(i, i + this.chunkSize);
        await this.repository.saveMany(chunk);
      }

      await this.cache.invalidate();

      for (const make of parsedMakes) {
        await this.syncVehicleTypes.execute(make.makeId);
      }
    } catch (error: any) {
      console.info(error?.message || error);
    }
  }
}
