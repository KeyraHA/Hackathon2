import { useEffect, useState, type CSSProperties } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSectorStory } from "../lib/sectorStory";
import type { SectorStory } from "../types/sector.ts";
import { useStoryStages } from "../hooks/useStoryStages";
import "../styles/sectorStory.css";

export default function SectorStoryPage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<SectorStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchSectorStory(id)
      .then((data) => {
        if (!cancelled) setStory(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la historia del sector");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stages = story?.stages ?? [];
  const { containerRef, setStageRef, activeIndex, progress, goNext, goPrev, handleKeyDown } =
    useStoryStages({ stageCount: stages.length });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="animate-pulse text-green-400">Cargando historia del sector...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-red-400">{error}</p>
        <Link to="/sectors" className="text-sm text-green-400 underline">
          Volver a sectores
        </Link>
      </div>
    );
  }

  if (!story || stages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-gray-400">Este sector todavia no tiene historia disponible.</p>
        <Link to="/sectors" className="text-sm text-green-400 underline">
          Volver a sectores
        </Link>
      </div>
    );
  }

  const activeStage = stages[activeIndex];

  return (
    <div data-view-transition="story-root">
      {/* Barra de progreso global del recorrido */}
      <div
        className="story-progress-track"
        role="progressbar"
        aria-label="Progreso de la historia"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(((activeIndex + 1) / stages.length) * 100)}
      >
        <div
          className="story-progress-fill"
          style={{ "--story-progress-fallback": progress } as CSSProperties}
        />
      </div>

      <div className="flex items-center justify-between border-b border-green-900 bg-gray-900/80 px-6 py-3 backdrop-blur">
        <div>
          <Link to="/sectors" className="text-xs text-gray-500 hover:text-green-400">
            ← Volver a sectores
          </Link>
          <h1 className="text-lg font-bold text-green-400">{story.sectorName}</h1>
        </div>
        <span className="text-xs text-gray-500">
          Etapa {activeIndex + 1} de {stages.length}
        </span>
      </div>

      {/* Contenedor scrollytelling: grid de 2 columnas en desktop,
          1 columna apilada en mobile (mismo comportamiento, distinto layout) */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Historia del sector ${story.sectorName}, navegable con flechas arriba y abajo`}
        className="grid grid-cols-1 gap-8 px-6 pb-24 outline-none lg:grid-cols-[1fr_1fr]"
      >
        {/* Panel visual persistente (sticky) */}
        <div className="order-1 lg:order-2">
          <div className="story-visual-panel">
            <StageVisual stage={activeStage} />
          </div>
        </div>

        {/* Etapas narrativas */}
        <div className="order-2 flex flex-col gap-16 lg:order-1">
          {stages.map((stage, index) => (
            <section
              key={stage.id}
              ref={setStageRef(index)}
              className={`story-stage ${index === activeIndex ? "is-active" : ""}`}
              aria-current={index === activeIndex ? "step" : undefined}
            >
              <p className="mb-2 text-xs uppercase tracking-widest text-green-600">
                Etapa {index + 1}
              </p>
              <h2 className="mb-4 text-2xl font-bold text-white">{stage.title}</h2>
              <p className="max-w-prose text-gray-300">{stage.body}</p>

              {stage.metrics.length > 0 && (
                <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stage.metrics.map((m) => (
                    <div key={m.label} className="rounded-lg border border-green-900 bg-gray-900/60 p-3">
                      <dt className="text-[10px] uppercase tracking-wide text-gray-500">{m.label}</dt>
                      <dd className="text-lg font-semibold text-green-300">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Controles accesibles, no dependen solo del teclado/scroll */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-3">
        <button
          onClick={goPrev}
          disabled={activeIndex === 0}
          className="rounded-full border border-green-800 bg-gray-900 px-4 py-2 text-sm text-green-300 disabled:opacity-30"
        >
          ↑ Anterior
        </button>
        <button
          onClick={goNext}
          disabled={activeIndex === stages.length - 1}
          className="rounded-full border border-green-800 bg-gray-900 px-4 py-2 text-sm text-green-300 disabled:opacity-30"
        >
          Siguiente ↓
        </button>
      </div>
    </div>
  );
}

function StageVisual({ stage }: { stage: SectorStory["stages"][number] }) {
  const { visual } = stage;

  const style: CSSProperties =
    visual.kind === "gradient"
      ? { background: `linear-gradient(135deg, var(--tw-gradient-stops, ${visual.value}))` }
      : {};

  if (visual.kind === "image") {
    return (
      <img
        key={stage.id}
        src={visual.value}
        alt={stage.title}
        className="story-visual-art is-active object-cover"
      />
    );
  }

  if (visual.kind === "icon") {
    return (
      <div key={stage.id} className="story-visual-art is-active flex items-center justify-center bg-gray-900 text-6xl">
        {visual.value}
      </div>
    );
  }

  return (
    <div
      key={stage.id}
      className={`story-visual-art is-active bg-gradient-to-br ${visual.value}`}
      style={style}
    />
  );
}
