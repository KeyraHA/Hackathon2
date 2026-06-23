import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSignalsFeed } from "../lib/signals.ts";
import type { Signal, SignalFeedQuery } from "../types/signal.ts";

interface FeedFilters {
  signalType?: string;
  severity?: string;
  status?: string;
  q?: string;
}

const LIMIT = 15;

export function useSignalsFeed(filters: FeedFilters) {
  const [items, setItems] = useState<Signal[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const loadingRef = useRef(false);

  const load = useCallback(
    (mode: "reset" | "more") => {
      // Solo una carga adicional en vuelo a la vez.
      if (mode === "more" && loadingRef.current) return;
      if (mode === "more" && !hasMore) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      loadingRef.current = true;

      if (mode === "reset") {
        setInitialLoading(true);
        setItems([]);
        seenIdsRef.current = new Set();
        cursorRef.current = undefined;
        setHasMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const query: SignalFeedQuery = {
        cursor: mode === "more" ? cursorRef.current : undefined,
        limit: LIMIT,
        signalType: filters.signalType,
        severity: filters.severity,
        status: filters.status,
        q: filters.q,
      };

      fetchSignalsFeed(query, controller.signal)
        .then((res) => {
          if (controller.signal.aborted) return;

          const fresh = res.items.filter((item) => !seenIdsRef.current.has(item.id));
          fresh.forEach((item) => seenIdsRef.current.add(item.id));

          setItems((prev) => (mode === "reset" ? fresh : [...prev, ...fresh]));
          cursorRef.current = res.nextCursor ?? undefined;
          setHasMore(res.hasMore && Boolean(res.nextCursor));
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          // En error de pagina posterior, NO se borran las paginas ya cargadas.
          setError(err instanceof Error ? err.message : "Error al cargar señales");
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          loadingRef.current = false;
          setLoading(false);
          setInitialLoading(false);
        });
    },
    [filters.signalType, filters.severity, filters.status, filters.q, hasMore]
  );

  // Reset completo cuando cambian los filtros (con request previa cancelada).
  useEffect(() => {
    load("reset");
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.signalType, filters.severity, filters.status, filters.q]);

  const loadMore = useCallback(() => load("more"), [load]);
  const retry = useCallback(() => load("more"), [load]);

  const patchItem = useCallback((id: string, patch: Partial<Signal>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  return {
    items,
    hasMore,
    loading,
    initialLoading,
    error,
    loadMore,
    retry,
    patchItem,
  };
}
