export interface Operator {
  id: string;
  email: string;
  teamCode: string;
}

export interface DashboardSummary {
  totalTropels: number;
  activeTropels: number;
  pendingSignals: number;
  criticalSignals: number;
  sectorsCount: number;
  chaosIndexAverage: number;
}