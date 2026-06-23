import { useEffect, useState } from "react";
import { fetchSignalDetail, updateSignalStatus } from "../lib/signals.ts";
import type { Signal, UpdatableSignalStatus } from "../types/signal.ts";

const UPDATABLE_STATES: UpdatableSignalStatus[] = ["PROCESANDO", "ATENDIDA"];

interface SignalDetailDrawerProps {
  signalId: string;
  onClose: () => void;
  onUpdated: (signal: Signal) => void;
}

export default function SignalDetailDrawer({ signalId, onClose, onUpdated }: SignalDetailDrawerProps) {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    setConfirmed(false);

    fetchSignalDetail(signalId, controller.signal)
      .then(setSignal)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof Error ? err.message : "No se pudo cargar la señal");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [signalId]);

  async function handleUpdate(status: UpdatableSignalStatus) {
    if (!signal) return;
    setUpdating(true);
    setUpdateError(null);
    setConfirmed(false);

    try {
      const updated = await updateSignalStatus(signal.id, status);
      setSignal(updated);
      onUpdated(updated);
      setConfirmed(true);
    } catch (err) {
      // Se conserva el estado anterior si falla.
      setUpdateError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-gray-950 border-l border-green-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-green-400">Detalle de Señal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {loading && <p className="animate-pulse text-green-400">Cargando señal...</p>}

        {loadError && (
          <div className="flex flex-col gap-2">
            <p className="text-red-400">{loadError}</p>
          </div>
        )}

        {!loading && !loadError && signal && (
          <div className="flex flex-col gap-4">
            <div className="rounded border border-gray-800 p-4 text-sm">
              <p className="text-gray-500">Tipo</p>
              <p className="mb-3 text-white">{signal.signalType}</p>
              <p className="text-gray-500">Severidad</p>
              <p className="mb-3 text-white">{signal.severity}</p>
              <p className="text-gray-500">Estado actual</p>
              <p className="text-white">{signal.status}</p>
              {signal.message && (
                <>
                  <p className="mt-3 text-gray-500">Mensaje</p>
                  <p className="text-white">{signal.message}</p>
                </>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                Cambiar estado
              </p>
              <div className="flex gap-2">
                {UPDATABLE_STATES.map((state) => (
                  <button
                    key={state}
                    disabled={updating || signal.status === state}
                    onClick={() => handleUpdate(state)}
                    className="rounded border border-green-800 px-3 py-2 text-sm text-green-300 disabled:opacity-30"
                  >
                    {updating ? "Actualizando..." : state}
                  </button>
                ))}
              </div>

              {updateError && (
                <div className="mt-3 flex items-center justify-between rounded bg-red-950/40 px-3 py-2 text-sm text-red-300">
                  <span>{updateError}</span>
                </div>
              )}

              {confirmed && !updateError && (
                <p className="mt-3 text-sm text-green-400">Estado actualizado correctamente.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
