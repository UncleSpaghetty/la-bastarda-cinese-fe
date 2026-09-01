import { useCallback, useEffect, useRef, useState } from "react";

import type { MatchState } from "./api";
import { normalizeGameAnimations, type GameAnimation } from "./game-animation-events";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useGameAnimations(current?: MatchState) {
  const previous = useRef<MatchState | undefined>(undefined);
  const lastSequence = useRef<number | undefined>(undefined);
  const initialized = useRef(false);
  const nextMode = useRef<"event" | "resync">("event");
  const [animations, setAnimations] = useState<GameAnimation[]>([]);
  const suppressNextAnimation = useCallback(() => {
    nextMode.current = "resync";
  }, []);

  useEffect(() => {
    if (!current) return;
    const event = current.payload.recent_events?.[0];
    if (!initialized.current) {
      initialized.current = true;
      lastSequence.current = event?.sequence;
      previous.current = current;
      nextMode.current = "event";
      return;
    }
    if (event && event.sequence > (lastSequence.current ?? 0)) {
      const next = normalizeGameAnimations({
        previous: previous.current,
        current,
        event,
        mode: nextMode.current,
        reducedMotion: prefersReducedMotion(),
      });
      setAnimations(next);
      lastSequence.current = event.sequence;
    }
    previous.current = current;
    nextMode.current = "event";
  }, [current]);

  useEffect(() => {
    if (!animations.length) return;
    const timeout = window.setTimeout(() => setAnimations([]), 900);
    return () => window.clearTimeout(timeout);
  }, [animations]);

  return { animations, suppressNextAnimation };
}
