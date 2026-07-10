"use client";

import { useEffect, useState } from "react";

/**
 * Tracks prefers-reduced-motion live (not just at mount) since the Indicator's
 * flip-in is a one-shot moment — if the OS setting changes mid-session we
 * still want the next render to respect it.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const handleChange = (event: MediaQueryListEvent): void => {
      setReduced(event.matches);
    };
    query.addEventListener("change", handleChange);
    return () => {
      query.removeEventListener("change", handleChange);
    };
  }, []);

  return reduced;
}
