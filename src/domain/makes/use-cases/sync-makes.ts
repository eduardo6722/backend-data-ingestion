import { logger } from '../../../logger';
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
    let makes;
    try {
      makes = await this.catalog.getAllMakes();
    } catch (err) {
      logger.error({ err }, 'API request failed');
      return;
    }

    if (!makes?.length) {
      return;
    }

    const parsedMakes: Make[] = [];
    for (const make of makes) {
      try {
        parsedMakes.push(new Make(String(make.id), String(make.name)));
      } catch (err) {
        logger.error({ err, make }, 'Transformation error');
      }
    }

    if (!parsedMakes.length) {
      return;
    }

    try {
      for (let i = 0; i < parsedMakes.length; i += this.chunkSize) {
        const chunk = parsedMakes.slice(i, i + this.chunkSize);
        await this.repository.saveMany(chunk);
      }
    } catch (err) {
      logger.error({ err }, 'Datastore insertion error');
      return;
    }

    await this.cache.invalidate();

    for (const make of parsedMakes) {
      await this.syncVehicleTypes.execute(make.makeId);
    }
  }
}
