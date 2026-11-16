"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

interface PerspectiveGridProps {
  className?: string;
  /** Tiles per row/column. */
  gridSize?: number;
  showOverlay?: boolean;
  /** Fade radius percentage for the edge overlay. */
  fadeRadius?: number;
  /** Colour the edges fade into — usually the section background. */
  fadeColor?: string;
  /** Classes for each tile (border + hover colour). */
  tileClassName?: string;
}

export function PerspectiveGrid({
  className,
  gridSize = 40,
  showOverlay = true,
  fadeRadius = 80,
  fadeColor = "#ffffff",
  tileClassName,
}: PerspectiveGridProps) {
  // Tiles are decorative; skip rendering ~1,500 divs into the server HTML.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const tiles = useMemo(() => Array.from({ length: gridSize * gridSize }), [gridSize]);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ perspective: "2000px", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute grid aspect-square w-[80rem] origin-center"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotateX(30deg) rotateY(-5deg) rotateZ(20deg) scale(2)",
          transformStyle: "preserve-3d",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {mounted &&
          tiles.map((_, i) => (
            <div
              key={i}
              className={cn(
                "min-h-px min-w-px border border-gray-300 bg-transparent transition-colors duration-[1500ms] hover:duration-0",
                tileClassName,
              )}
            />
          ))}
      </div>

      {showOverlay && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: `radial-gradient(circle, transparent 25%, ${fadeColor} ${fadeRadius}%)` }}
        />
      )}
    </div>
  );
}

/** Adapted from Vengeance UI — https://www.vengenceui.com */
export default PerspectiveGrid;
