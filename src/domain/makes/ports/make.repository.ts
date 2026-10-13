import { IRepository, Page } from '../../shared/ports/repository';
import { Make } from '../entity/make';

export const MAKE_REPOSITORY = Symbol('MAKE_REPOSITORY');

export interface IMakeRepository extends Pick<
  IRepository<Make, string>,
  'save'
> {
  getMany(skip: number, take: number): Promise<Page<Make>>;
  saveMany(makes: Make[]): Promise<void>;
}
