"use client";

import { useEffect, useState } from "react";

const PAGING_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp"]);

function ScrollWheelIcon() {
  return (
    <svg
      className="phone-scroll-hint-wheel"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3.5"
        y="1.5"
        width="7"
        height="11"
        rx="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect x="6" y="3.5" width="2" height="3.5" rx="1" fill="currentColor" />
    </svg>
  );
}

export function ScrollHint({
  onPage,
}: {
  onPage: (direction: -1 | 1) => void;
}) {
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    if (nudgeDismissed) {
      return;
    }

    function dismiss() {
      setNudgeDismissed(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (PAGING_KEYS.has(event.key)) {
        dismiss();
      }
    }

    function onWheel() {
      dismiss();
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [nudgeDismissed]);

  function page(direction: -1 | 1) {
    onPage(direction);
    setNudgeDismissed(true);
  }

  return (
    <div
      className={[
        "phone-scroll-hint",
        nudgeDismissed ? "phone-scroll-hint--keys-only" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!nudgeDismissed ? (
        <span className="phone-scroll-hint-nudge">
          <ScrollWheelIcon />
          <span>Scroll wheel or ↑↓</span>
        </span>
      ) : null}
      <button
        type="button"
        className="phone-scroll-hint-key focus-ring"
        aria-label="Previous Short"
        onClick={() => page(-1)}
      >
        ↑
      </button>
      <button
        type="button"
        className="phone-scroll-hint-key focus-ring"
        aria-label="Next Short"
        onClick={() => page(1)}
      >
        ↓
      </button>
    </div>
  );
}
