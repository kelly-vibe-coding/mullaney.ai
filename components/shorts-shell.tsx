"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FeedClip } from "@/lib/feed";
import { useIsDesktop } from "@/lib/use-is-desktop";

import { AboutSheet } from "./about-sheet";
import { IPhoneFrame } from "./iphone-frame";
import { ScrollHint } from "./scroll-hint";
import { ShortsFeed, type ShortsFeedControls } from "./shorts-feed";

const PAGE_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  " ",
  "Spacebar",
]);

const WHEEL_THRESHOLD = 40;
const WHEEL_COOLDOWN_MS = 520;

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, select, [contenteditable=true]"))
  );
}

export function ShortsShell({ clips }: {
  clips: readonly FeedClip[];
}) {
  const isDesktop = useIsDesktop();
  const enableAbout = !isDesktop;
  const [aboutOpen, setAboutOpen] = useState(false);
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
        return;
      }

      accumulated += event.deltaY;
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
        <ScrollHint onPage={pageFeed} />
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
            />
          </div>
        </IPhoneFrame>
      </div>
      <AboutSheet open={aboutOpen} onClose={closeAbout} />
    </div>
  );
}
