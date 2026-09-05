"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FeedClip } from "@/lib/feed";
import { useIsDesktop } from "@/lib/use-is-desktop";

import { AboutSheet } from "./about-sheet";
import { FeedControls } from "./feed-controls";
import { IPhoneFrame } from "./iphone-frame";
import { ShortsFeed, type ShortsFeedControls } from "./shorts-feed";

const PAGE_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  " ",
  "Spacebar",
]);

const WHEEL_THRESHOLD = 30;
const WHEEL_COOLDOWN_MS = 520;

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, select, [contenteditable=true]"))
  );
}

function normalizeWheelDelta(event: WheelEvent) {
  // Firefox mouse wheels often report line deltas (~3 per notch).
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }
  if (event.deltaMode === 2) {
    return event.deltaY * window.innerHeight;
  }
  return event.deltaY;
}

export function ShortsShell({ clips }: {
  clips: readonly FeedClip[];
}) {
  const isDesktop = useIsDesktop();
  const enableAbout = !isDesktop;
  const [aboutOpen, setAboutOpen] = useState(false);
  const [flashTick, setFlashTick] = useState(0);
  const feedRef = useRef<ShortsFeedControls>(null);
  const openAbout = useCallback(() => {
    setAboutOpen(true);
  }, []);
  const closeAbout = useCallback(() => {
    setAboutOpen(false);
  }, []);
  const pageFeed = useCallback((direction: -1 | 1) => {
    feedRef.current?.page(direction);
  }, []);
  const handleAutoAdvance = useCallback(() => {
    setFlashTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (aboutOpen) {
      return;
    }

    let lockedUntil = 0;
    let accumulated = 0;

    function onWheel(event: WheelEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      const now = Date.now();
      if (now < lockedUntil) {
        accumulated = 0;
        return;
      }

      accumulated += normalizeWheelDelta(event);
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) {
        return;
      }

      const direction: -1 | 1 = accumulated > 0 ? 1 : -1;
      accumulated = 0;
      lockedUntil = now + WHEEL_COOLDOWN_MS;
      pageFeed(direction);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }
      if (!PAGE_KEYS.has(event.key)) {
        return;
      }

      // Don't steal Space from focused buttons (mute, rail, etc.).
      if (
        (event.key === " " || event.key === "Spacebar") &&
        event.target instanceof HTMLElement &&
        event.target.closest("button, a, [role='button']")
      ) {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        event.preventDefault();
        pageFeed(1);
        return;
      }

      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        pageFeed(-1);
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [aboutOpen, pageFeed]);

  return (
    <div className="shorts-device">
      <div className="shorts-device-stack">
        <IPhoneFrame>
          <div
            className="shorts-feed-host"
            inert={aboutOpen || undefined}
            aria-hidden={aboutOpen || undefined}
          >
            <ShortsFeed
              ref={feedRef}
              clips={clips}
              onAbout={openAbout}
              aboutOpen={aboutOpen}
              enableAbout={enableAbout}
              onAutoAdvance={handleAutoAdvance}
            />
          </div>
        </IPhoneFrame>
        <FeedControls onPage={pageFeed} flashTick={flashTick} />
      </div>
      <AboutSheet open={aboutOpen} onClose={closeAbout} />
    </div>
  );
}
