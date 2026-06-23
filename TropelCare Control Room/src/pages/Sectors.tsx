import { useEffect, useState } from "react";
import { fetchSectors } from "../lib/sectorStory";
import type { Sector } from "../types/sector.ts";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

export default function Sectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useViewTransitionNavigate();

  useEffect(() => {
    fetchSectors()
      .then(setSectors)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar sectores"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="animate-pulse text-green-400">Cargando sectores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">No hay sectores disponibles.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-green-400">Sectores de la Colonia</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <button
            key={sector.id}
            data-view-transition="sector-card"
            onClick={() => navigate(`/sectors/${sector.id}/story`)}
            className="rounded-xl border border-green-900 bg-gray-900 p-5 text-left transition hover:border-green-600"
          >
            <p className="text-lg font-semibold text-white">{sector.name}</p>
            {sector.description && (
              <p className="mt-1 text-sm text-gray-400">{sector.description}</p>
            )}
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              {sector.tropelCount !== undefined && <span>{sector.tropelCount} tropeles</span>}
              {sector.chaosIndex !== undefined && <span>Chaos: {sector.chaosIndex.toFixed(2)}</span>}
            </div>
            <span className="mt-3 inline-block text-sm text-green-400">Ver historia →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
