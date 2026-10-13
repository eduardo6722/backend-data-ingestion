export type Page<T> = {
  items: T[];
  total: number;
};

export interface IRepository<T, TId> {
  findById(id: TId): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: TId): Promise<void>;
}
