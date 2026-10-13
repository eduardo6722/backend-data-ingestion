export const MAKE_CATALOG = Symbol('MAKE_CATALOG');

export type MakeCatalogItemType = {
  id: string;
  name: string;
};

export interface IMakeCatalog {
  getAllMakes(): Promise<MakeCatalogItemType[]>;
}
