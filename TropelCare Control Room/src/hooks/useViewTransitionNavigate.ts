import { useCallback } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function useViewTransitionNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      const doc = document as DocumentWithViewTransition;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (!prefersReducedMotion && typeof doc.startViewTransition === "function") {
        doc.startViewTransition(() => {
          navigate(to, options);
        });
        return;
      }

      navigate(to, options);
    },
    [navigate]
  );
}
