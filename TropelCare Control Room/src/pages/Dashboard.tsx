import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import type { DashboardSummary } from "../types/api";

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardSummary>("/dashboard/summary")
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <span className="animate-pulse text-green-400">Cargando indicadores...</span>
    </div>
  );

  if (error) return (
    <div className="flex h-full items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  );

  if (!data) return null;

  const cards = [
    { label: "Total Tropeles", value: data.totalTropels },
    { label: "Tropeles Activos", value: data.activeTropels },
    { label: "Señales Pendientes", value: data.pendingSignals },
    { label: "Señales Críticas", value: data.criticalSignals },
    { label: "Sectores", value: data.sectorsCount },
    { label: "Chaos Index Promedio", value: data.chaosIndexAverage?.toFixed(2) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-green-400">Estado General de la Colonia</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-green-900 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-green-300">{c.value ?? "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}