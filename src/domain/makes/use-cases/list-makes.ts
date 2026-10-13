import { logger } from '../../../logger';
import { Page } from '../../shared/ports/repository';
import { Make } from '../entity/make';
import { IMakeCache } from '../ports/make.cache';
import { IMakeRepository } from '../ports/make.repository';

type ExecuteParams = {
  skip: number;
  take: number;
};

export class GetMakesUseCase {
  constructor(
    private readonly repository: IMakeRepository,
    private readonly cache: IMakeCache,
  ) {}

  async execute(params?: ExecuteParams): Promise<Page<Make> | null> {
    try {
      const skip = params?.skip || 0;
      const take = params?.take || 10;

      const cached = await this.cache.getMany(skip, take);
      if (cached) {
        return cached;
      }

      const result = await this.repository.getMany(skip, take);
      await this.cache.setMany(skip, take, result);

      return result;
    } catch (err) {
      logger.error({ err }, 'unexpected exception');
      return null;
    }
  }
}
