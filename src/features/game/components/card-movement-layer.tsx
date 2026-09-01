import { useLayoutEffect, useRef } from "react";

import type { GameAnimation } from "../game-animation-events";

export function CardMovementLayer({ animations }: { animations: GameAnimation[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    for (const animation of animations) {
      const origin = document.querySelector<HTMLElement>(
        `[data-motion-anchor="${animation.from}"]`
      );
      const target = document.querySelector<HTMLElement>(`[data-motion-anchor="${animation.to}"]`);
      if (!origin || !target) continue;
      const from = origin.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      layer
        .querySelectorAll<HTMLElement>(`[data-movement-id="${animation.id}"]`)
        .forEach((particle) => {
          particle.style.setProperty("--motion-from-x", `${from.left + from.width / 2}px`);
          particle.style.setProperty("--motion-from-y", `${from.top + from.height / 2}px`);
          particle.style.setProperty("--motion-to-x", `${to.left + to.width / 2}px`);
          particle.style.setProperty("--motion-to-y", `${to.top + to.height / 2}px`);
        });
    }
  }, [animations]);
  return (
    <div className="card-movement-layer" ref={ref} aria-hidden="true">
      {animations.flatMap((animation) =>
        Array.from(
          {
            length: ["collect", "banish"].includes(animation.kind)
              ? Math.min(animation.count, 3)
              : animation.count,
          },
          (_, index) => (
            <i
              className={`movement-card movement-${animation.kind}`}
              data-movement-id={animation.id}
              key={`${animation.id}-${index}`}
              style={{ "--motion-delay": `${index * 70}ms` } as React.CSSProperties}
            />
          )
        )
      )}
    </div>
  );
}
