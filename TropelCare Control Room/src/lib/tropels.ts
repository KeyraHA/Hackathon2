import { apiFetch } from "./api";
import { buildQueryString } from "./queryString";
import type { TropelPage, TropelQuery } from "../types/tropel.ts";

export function fetchTropels(query: TropelQuery, signal?: AbortSignal): Promise<TropelPage> {
  const qs = buildQueryString({
    page: query.page,
    size: query.size,
    species: query.species,
    vitalState: query.vitalState,
    sectorId: query.sectorId,
    q: query.q,
    sort: query.sort,
  });
  return apiFetch<TropelPage>(`/tropels${qs}`, { signal });
}
