"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

export function FeedControls({
  onPage,
  flashTick,
}: {
  onPage: (direction: -1 | 1) => void;
  flashTick: number;
}) {
  return (
    <div className="feed-controls">
      <button
        type="button"
        className="feed-chevron focus-ring"
        aria-label="Previous Short"
        aria-keyshortcuts="ArrowUp"
        onClick={() => onPage(-1)}
      >
        <ChevronUp size={26} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="feed-chevron focus-ring"
        aria-label="Next Short"
        aria-keyshortcuts="ArrowDown"
        onClick={() => onPage(1)}
      >
        {flashTick > 0 ? (
          <span
            key={flashTick}
            className="feed-chevron-flash-pulse"
            aria-hidden="true"
          />
        ) : null}
        <ChevronDown size={26} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
