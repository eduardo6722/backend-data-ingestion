import { Page } from '../../shared/ports/repository';
import { Make } from '../entity/make';

export const MAKE_CACHE = Symbol('MAKE_CACHE');

export interface IMakeCache {
  getMany(skip: number, take: number): Promise<Page<Make> | null>;
  setMany(skip: number, take: number, page: Page<Make>): Promise<void>;
  invalidate(): Promise<void>;
}
