
export interface Tropel {
  id: string;
  name: string;
  species: string;
  vitalState: string;
  sectorId?: string;
  chaosIndex?: number;
  updatedAt?: string;
}

export interface TropelPage {
  content: Tropel[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export type TropelSort = "name,asc" | "updatedAt,desc" | "chaosIndex,desc";

export interface TropelQuery {
  page: number;
  size: number;
  species?: string;
  vitalState?: string;
  sectorId?: string;
  q?: string;
  sort: TropelSort;
}
