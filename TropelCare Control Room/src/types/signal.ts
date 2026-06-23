
export interface Signal {
  id: string;
  signalType: string;
  severity: string;
  status: string;
  tropelId?: string;
  sectorId?: string;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdatableSignalStatus = "PROCESANDO" | "ATENDIDA";

export interface SignalFeedResponse {
  items: Signal[];
  nextCursor: string | null;
  hasMore: boolean;
  totalEstimate?: number;
}

export interface SignalFeedQuery {
  cursor?: string;
  limit: number;
  signalType?: string;
  severity?: string;
  status?: string;
  q?: string;
}
