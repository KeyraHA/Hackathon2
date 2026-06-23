import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

interface UseStoryStagesOptions {
  stageCount: number;
}

export function useStoryStages({ stageCount }: UseStoryStagesOptions) {
  const stageRefs = useRef<(HTMLElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 a 1, fallback para navegadores sin scroll-timeline

  const setStageRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      stageRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    if (stageCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const index = stageRefs.current.findIndex((el) => el === visible[0].target);
          if (index !== -1) setActiveIndex(index);
        }
      },
      {
        threshold: [0.25, 0.5, 0.75],
        rootMargin: "-35% 0px -35% 0px",
      }
    );

    stageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [stageCount]);

  useEffect(() => {
    const supportsScrollTimeline =
      typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: scroll()");
    if (supportsScrollTimeline) return; // el CSS se encarga directamente

    function handleScroll() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const ratio = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      setProgress(ratio);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToStage = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(stageCount - 1, index));
    const el = stageRefs.current[clamped];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [stageCount]);

  const goNext = useCallback(() => goToStage(activeIndex + 1), [activeIndex, goToStage]);
  const goPrev = useCallback(() => goToStage(activeIndex - 1), [activeIndex, goToStage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          goPrev();
          break;
        case "Home":
          e.preventDefault();
          goToStage(0);
          break;
        case "End":
          e.preventDefault();
          goToStage(stageCount - 1);
          break;
        default:
          break;
      }
    },
    [goNext, goPrev, goToStage, stageCount]
  );

  return {
    containerRef,
    setStageRef,
    activeIndex,
    progress,
    goToStage,
    goNext,
    goPrev,
    handleKeyDown,
  };
}
