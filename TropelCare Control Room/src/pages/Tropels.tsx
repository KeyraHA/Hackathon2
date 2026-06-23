import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTropels } from "../lib/tropels";
import { fetchSectors } from "../lib/sectorStory";
import type { Tropel, TropelPage, TropelSort } from "../types/tropel";
import type { Sector } from "../types/sector";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const SORT_OPTIONS: { value: TropelSort; label: string }[] = [
  { value: "updatedAt,desc", label: "Actualizado recientemente" },
  { value: "name,asc", label: "Nombre (A-Z)" },
  { value: "chaosIndex,desc", label: "Chaos Index (mayor primero)" },
];

const SIZE_OPTIONS = [10, 20, 50] as const;

export default function Tropels() {
  const [params, setParams] = useSearchParams();

  // ---- Estado derivado de la URL (fuente de verdad) ----
  const page = Number(params.get("page") ?? "0") || 0;
  const size = (Number(params.get("size") ?? "10") as 10 | 20 | 50) || 10;
  const species = params.get("species") ?? "";
  const vitalState = params.get("vitalState") ?? "";
  const sectorId = params.get("sectorId") ?? "";
  const q = params.get("q") ?? "";
  const sort = (params.get("sort") as TropelSort) || "updatedAt,desc";

  // Input de busqueda local, debounced antes de tocar la URL
  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch === q) return;
    updateParams({ q: debouncedSearch, page: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function updateParams(patch: Record<string, string | number | undefined>) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    });
  }

  // ---- Sectores para el filtro (lista chica, no es el dataset paginado) ----
  const [sectors, setSectors] = useState<Sector[]>([]);
  useEffect(() => {
    fetchSectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  // ---- Carga de tropeles con proteccion contra respuestas tardias ----
  const [data, setData] = useState<TropelPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetchTropels({ page, size, species, vitalState, sectorId, q, sort }, controller.signal)
      .then((res) => {
        // Si llego otra request despues de esta, se descarta el resultado.
        if (requestIdRef.current !== requestId) return;
        setData(res);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "Error al cargar Tropeles");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });

    return () => controller.abort();
  }, [page, size, species, vitalState, sectorId, q, sort]);

  const rowsToShow = useMemo(() => Math.max(data?.content.length ?? 0, size), [data, size]);

  const goToPage = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (data && next >= data.totalPages) return;
      updateParams({ page: next });
    },
    [data]
  );

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-green-400">Atlas de Tropeles</h1>

      {/* Filtros combinables, todo reflejado en la URL */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre..."
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        />
        <input
          value={species}
          onChange={(e) => updateParams({ species: e.target.value, page: 0 })}
          placeholder="Especie"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        />
        <input
          value={vitalState}
          onChange={(e) => updateParams({ vitalState: e.target.value, page: 0 })}
          placeholder="Estado vital"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        />
        <select
          value={sectorId}
          onChange={(e) => updateParams({ sectorId: e.target.value, page: 0 })}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        >
          <option value="">Todos los sectores</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value, page: 0 })}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
        <span>
          {data ? `${data.totalElements} tropeles encontrados` : "—"}
        </span>
        <label className="flex items-center gap-2">
          Tamaño de pagina
          <select
            value={size}
            onChange={(e) => updateParams({ size: Number(e.target.value), page: 0 })}
            className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white"
          >
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Area de resultados con altura estable para que loading/error/vacio no muevan el layout */}
      <div style={{ minHeight: rowsToShow * 64 }}>
        {error && (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded border border-red-900 bg-red-950/30">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => updateParams({})}
              className="text-sm text-green-400 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && loading && (
          <ul className="divide-y divide-gray-800 rounded border border-gray-800">
            {Array.from({ length: size }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-1/4 animate-pulse rounded bg-gray-800" />
                <div className="h-4 w-1/6 animate-pulse rounded bg-gray-800" />
                <div className="h-4 w-1/6 animate-pulse rounded bg-gray-800" />
              </li>
            ))}
          </ul>
        )}

        {!error && !loading && data && data.content.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded border border-gray-800 text-gray-500">
            No se encontraron Tropeles con estos filtros.
          </div>
        )}

        {!error && !loading && data && data.content.length > 0 && (
          <ul className="divide-y divide-gray-800 rounded border border-gray-800">
            {data.content.map((tropel: Tropel) => (
              <li key={tropel.id} className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
                <span className="min-w-[10rem] font-semibold text-white">{tropel.name}</span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                  {tropel.species}
                </span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                  {tropel.vitalState}
                </span>
                {tropel.chaosIndex !== undefined && (
                  <span className="text-xs text-gray-500">Chaos: {tropel.chaosIndex.toFixed(2)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paginacion */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
            className="rounded border border-green-800 px-3 py-1 text-green-300 disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="text-gray-400">
            Pagina {page + 1} de {data.totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page + 1 >= data.totalPages}
            className="rounded border border-green-800 px-3 py-1 text-green-300 disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
