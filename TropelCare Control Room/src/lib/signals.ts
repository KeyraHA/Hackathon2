import { apiFetch } from "./api";
import { buildQueryString } from "./queryString";
import type { Signal, SignalFeedQuery, SignalFeedResponse, UpdatableSignalStatus } from "../types/signal.ts";

export function fetchSignalsFeed(
  query: SignalFeedQuery,
  signal?: AbortSignal
): Promise<SignalFeedResponse> {
  const qs = buildQueryString({
    cursor: query.cursor,
    limit: query.limit,
    signalType: query.signalType,
    severity: query.severity,
    status: query.status,
    q: query.q,
  });
  return apiFetch<SignalFeedResponse>(`/signals/feed${qs}`, { signal });
}

export function fetchSignalDetail(id: string, signal?: AbortSignal): Promise<Signal> {
  return apiFetch<Signal>(`/signals/${id}`, { signal });
}

export function updateSignalStatus(id: string, status: UpdatableSignalStatus): Promise<Signal> {
  return apiFetch<Signal>(`/signals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
