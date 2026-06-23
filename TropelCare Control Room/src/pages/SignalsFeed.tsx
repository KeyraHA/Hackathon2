import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSignalsFeed } from "../hooks/useSignalsFeed";
import { useInfiniteScrollSentinel } from "../hooks/useInfinitiveScrollSentinek.ts";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import SignalDetailDrawer from "../components/SignalDetailDrawer";
import type { Signal } from "../types/signal.ts";

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-950 text-red-300 border-red-800",
  HIGH: "bg-orange-950 text-orange-300 border-orange-800",
  MEDIUM: "bg-yellow-950 text-yellow-300 border-yellow-800",
  LOW: "bg-gray-800 text-gray-300 border-gray-700",
};

export default function SignalsFeed() {
  const [params, setParams] = useSearchParams();

  const signalType = params.get("signalType") ?? "";
  const severity = params.get("severity") ?? "";
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const activeSignalId = params.get("signal");

  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch === q) return;
    updateParams({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function updateParams(patch: Record<string, string | undefined>) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      });
      return next;
    });
  }

  const { items, hasMore, loading, initialLoading, error, loadMore, retry, patchItem } =
    useSignalsFeed({ signalType, severity, status, q });

  const sentinelRef = useInfiniteScrollSentinel(
    useCallback(() => loadMore(), [loadMore]),
    hasMore && !initialLoading && !error
  );

  function openDetail(id: string) {
    updateParams({ signal: id });
  }

  function closeDetail() {
    updateParams({ signal: undefined });
  }

  function handleUpdated(updated: Signal) {
    patchItem(updated.id, updated);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-green-400">Feed de Señales</h1>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar..."
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        />
        <input
          value={signalType}
          onChange={(e) => updateParams({ signalType: e.target.value })}
          placeholder="Tipo de señal"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        />
        <input
          value={severity}
          onChange={(e) => updateParams({ severity: e.target.value })}
          placeholder="Severidad"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        />
        <input
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          placeholder="Estado"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        />
      </div>

      {error && items.length === 0 && (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded border border-red-900 bg-red-950/30">
          <p className="text-red-400">{error}</p>
          <button onClick={retry} className="text-sm text-green-400 underline">
            Reintentar
          </button>
        </div>
      )}

      {initialLoading && (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-16 animate-pulse rounded border border-gray-800 bg-gray-900" />
          ))}
        </ul>
      )}

      {!initialLoading && items.length === 0 && !error && (
        <div className="flex h-32 items-center justify-center rounded border border-gray-800 text-gray-500">
          No hay señales con estos filtros.
        </div>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((signal) => (
            <li key={signal.id}>
              <button
                onClick={() => openDetail(signal.id)}
                className="flex w-full flex-wrap items-center gap-3 rounded border border-gray-800 bg-gray-900 px-4 py-3 text-left text-sm hover:border-green-700"
              >
                <span
                  className={`rounded border px-2 py-0.5 text-xs ${
                    SEVERITY_STYLES[signal.severity] ?? "bg-gray-800 text-gray-300 border-gray-700"
                  }`}
                >
                  {signal.severity}
                </span>
                <span className="font-semibold text-white">{signal.signalType}</span>
                <span className="text-gray-500">{signal.status}</span>
                {signal.message && (
                  <span className="truncate text-gray-400">{signal.message}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Sentinela para infinite scroll */}
      <div ref={sentinelRef} />

      {loading && !initialLoading && (
        <p className="py-4 text-center text-sm text-green-400 animate-pulse">
          Cargando más señales...
        </p>
      )}

      {error && items.length > 0 && (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={retry} className="text-sm text-green-400 underline">
            Reintentar
          </button>
        </div>
      )}

      {!hasMore && items.length > 0 && !loading && (
        <p className="py-4 text-center text-xs text-gray-500">No hay más señales.</p>
      )}

      {activeSignalId && (
        <SignalDetailDrawer
          signalId={activeSignalId}
          onClose={closeDetail}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
