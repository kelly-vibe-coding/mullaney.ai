"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type KeyboardEvent,
} from "react";

import type { FeedClip } from "@/lib/feed";
import {
  FEED_LOOP_COPIES,
  getInitialLoopIndex,
  getLogicalClipIndex,
  getLoopRecenter,
  recenterLoopIndex,
} from "@/lib/feed-loop";
import { buildYouTubeThumbnailUrl } from "@/lib/player";
import type { ClipVoteCounts, Reaction } from "@/lib/votes/constants";
import { computeReactionDelta } from "@/lib/votes/reactions";

import { ShortsChrome } from "./shorts-chrome";
import {
  ShortsMuteButton,
  YouTubeEmbed,
  type PlayerControls,
} from "./youtube-embed";

const TAP_SLOP_PX = 12;

const EMPTY_VOTES: ClipVoteCounts = {
  like: 0,
  dislike: 0,
  reaction: null,
};

function getAdjacentClipIds(
  clips: readonly FeedClip[],
  activeIndex: number,
): string[] {
  const logicalIndex = getLogicalClipIndex(activeIndex, clips.length);
  const ids = new Set<string>();

  for (const offset of [-1, 0, 1]) {
    const wrapped =
      (logicalIndex + offset + clips.length) % Math.max(clips.length, 1);
    const clip = clips[wrapped];
    if (clip) {
      ids.add(clip.id);
    }
  }

  return [...ids];
}

type LoopedSlide = {
  readonly key: string;
  readonly clip: FeedClip;
  readonly logicalIndex: number;
};

export type ShortsFeedControls = {
  page: (direction: -1 | 1) => void;
};

type ShortsFeedProps = {
  clips: readonly FeedClip[];
  onAbout: () => void;
  aboutOpen?: boolean;
  enableAbout?: boolean;
};

function ShortsFeedComponent(
  {
    clips,
    onAbout,
    aboutOpen = false,
    enableAbout = true,
  }: ShortsFeedProps,
  ref: ForwardedRef<ShortsFeedControls>,
) {
  const loopedSlides = useMemo(() => {
    const slides: LoopedSlide[] = [];

    for (let copy = 0; copy < FEED_LOOP_COPIES; copy += 1) {
      for (const [logicalIndex, clip] of clips.entries()) {
        slides.push({
          key: `${copy}-${clip.id}`,
          clip,
          logicalIndex,
        });
      }
    }

    return slides;
  }, [clips]);

  const [activeIndex, setActiveIndex] = useState(() =>
    getInitialLoopIndex(clips.length),
  );
  // Start muted for autoplay. Keep state above slides so it survives paging.
  const [muted, setMuted] = useState(true);
  const [scrollCueVisible, setScrollCueVisible] = useState(true);
  const [voteState, setVoteState] = useState<Record<string, ClipVoteCounts>>({});
  const playerApiRef = useRef<PlayerControls | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const isJumpingRef = useRef(false);
  const initialIndexRef = useRef(getInitialLoopIndex(clips.length));

  useEffect(() => {
    // Place a remounted feed at the loop midpoint after slides mount.
    const start = initialIndexRef.current;
    const target = slideRefs.current[start];
    if (!target) {
      return;
    }

    isJumpingRef.current = true;
    target.scrollIntoView?.({ behavior: "auto", block: "start" });
    const timer = window.setTimeout(() => {
      isJumpingRef.current = false;
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (aboutOpen) {
      playerApiRef.current?.pause();
    }
  }, [aboutOpen]);

  useEffect(() => {
    if (clips.length === 0) {
      return;
    }

    const clipIds = getAdjacentClipIds(clips, activeIndex);
    if (clipIds.length === 0) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/votes?clips=${encodeURIComponent(clipIds.join(","))}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          clips?: Record<string, ClipVoteCounts>;
        };

        if (!payload.clips) {
          return;
        }

        setVoteState((current) => ({
          ...current,
          ...payload.clips,
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [activeIndex, clips]);

  const handleReact = useCallback(
    async (clipId: string, nextReaction: Reaction) => {
      const prior = voteState[clipId] ?? EMPTY_VOTES;
      const delta = computeReactionDelta(prior.reaction, nextReaction);
      const optimistic: ClipVoteCounts = {
        like: Math.max(0, prior.like + delta.like),
        dislike: Math.max(0, prior.dislike + delta.dislike),
        reaction: nextReaction,
      };

      setVoteState((current) => ({
        ...current,
        [clipId]: optimistic,
      }));

      try {
        const response = await fetch(`/api/votes/${encodeURIComponent(clipId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction: nextReaction }),
        });

        if (!response.ok) {
          throw new Error("Vote request failed");
        }

        const payload = (await response.json()) as ClipVoteCounts & {
          clipId: string;
        };

        setVoteState((current) => ({
          ...current,
          [clipId]: {
            like: payload.like,
            dislike: payload.dislike,
            reaction: payload.reaction,
          },
        }));
      } catch {
        setVoteState((current) => ({
          ...current,
          [clipId]: prior,
        }));
      }
    },
    [voteState],
  );

  useEffect(() => {
    if (!scrollCueVisible) {
      return;
    }
    if (activeIndex !== initialIndexRef.current) {
      setScrollCueVisible(false);
    }
  }, [activeIndex, scrollCueVisible]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isJumpingRef.current) {
          return;
        }

        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!mostVisible) {
          return;
        }

        const index = Number(
          (mostVisible.target as HTMLElement).dataset.slideIndex,
        );

        if (Number.isInteger(index)) {
          setActiveIndex(index);
        }
      },
      { root, threshold: 0.65 },
    );

    for (const slide of slideRefs.current) {
      if (slide) {
        observer.observe(slide);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [loopedSlides]);

  // Recenter on an identical slide before the loop reaches either edge.
  useEffect(() => {
    if (clips.length === 0) {
      return;
    }

    const direction = getLoopRecenter(activeIndex, clips.length);
    if (!direction) {
      return;
    }

    const nextIndex = recenterLoopIndex(activeIndex, clips.length, direction);
    const target = slideRefs.current[nextIndex];
    if (!target) {
      return;
    }

    isJumpingRef.current = true;
    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
    setActiveIndex(nextIndex);

    const timer = window.setTimeout(() => {
      isJumpingRef.current = false;
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, clips.length]);

  // Passive touch listeners preserve iOS vertical scrolling.
  useEffect(() => {
    const root = feedRef.current;
    if (!root) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let moved = false;
    let lastTouchToggleAt = 0;

    function isChromeControl(target: EventTarget | null) {
      return (
        target instanceof Element &&
        Boolean(target.closest("button, a, [data-no-pause]"))
      );
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        return;
      }

      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      moved = false;
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      if (
        Math.abs(touch.clientX - startX) > TAP_SLOP_PX ||
        Math.abs(touch.clientY - startY) > TAP_SLOP_PX
      ) {
        moved = true;
      }
    }

    function onTouchEnd(event: TouchEvent) {
      if (moved || isChromeControl(event.target)) {
        return;
      }

      lastTouchToggleAt = Date.now();
      playerApiRef.current?.togglePause();
    }

    function onClick(event: MouseEvent) {
      // Ignore the synthetic click that follows a touch toggle on mobile.
      if (Date.now() - lastTouchToggleAt < 450) {
        return;
      }

      if (isChromeControl(event.target)) {
        return;
      }

      playerApiRef.current?.togglePause();
    }

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("click", onClick);

    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("click", onClick);
    };
  }, []);

  const scrollToIndex = useCallback((destination: number) => {
    const clamped = Math.max(
      0,
      Math.min(loopedSlides.length - 1, destination),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    slideRefs.current[clamped]?.scrollIntoView?.({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [loopedSlides.length]);

  const activeSlide = loopedSlides[activeIndex] ?? loopedSlides[0];
  const activeClip = activeSlide?.clip ?? clips[0];
  const logicalPosition =
    clips.length === 0
      ? 0
      : getLogicalClipIndex(activeIndex, clips.length) + 1;

  useImperativeHandle(
    ref,
    () => ({
      page(direction) {
        scrollToIndex(activeIndex + direction);
      },
    }),
    [activeIndex, scrollToIndex],
  );

  const handleVideoEnded = useCallback(() => {
    if (!aboutOpen) {
      scrollToIndex(activeIndex + 1);
    }
  }, [aboutOpen, activeIndex, scrollToIndex]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "PageDown":
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
        return;
      case "ArrowUp":
      case "PageUp":
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
        return;
      case "Home":
        event.preventDefault();
        scrollToIndex(getInitialLoopIndex(clips.length));
        return;
      case "End":
        event.preventDefault();
        scrollToIndex(
          getInitialLoopIndex(clips.length) + Math.max(clips.length - 1, 0),
        );
        return;
      case " ":
      case "k":
      case "K":
        event.preventDefault();
        playerApiRef.current?.togglePause();
        return;
      default:
        return;
    }
  }

  const toggleMute = useCallback(() => {
    const next = !muted;
    playerApiRef.current?.applyMute(next);
    setMuted(next);
  }, [muted]);

  return (
    <div className="shorts-stage">
      {/* iOS ignores pointer-events:none on iframes. Keep the player under the
          feed so the feed owns vertical swipes. */}
      {activeClip ? (
        <div className="shorts-player-layer" aria-hidden={aboutOpen || undefined}>
          <YouTubeEmbed
            clip={activeClip}
            title={`YouTube Short ${logicalPosition} of ${clips.length}: ${activeClip.caption}`}
            muted={muted}
            playerApiRef={playerApiRef}
            onEnded={handleVideoEnded}
          />
        </div>
      ) : null}

      <div
        ref={feedRef}
        className="shorts-feed focus-ring"
        tabIndex={0}
        aria-label="Shorts"
        onKeyDown={handleKeyDown}
      >
        {loopedSlides.map((slide, index) => {
          const isPlaying = index === activeIndex;

          return (
            <section
              key={slide.key}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              className={
                isPlaying ? "shorts-slide shorts-slide--playing" : "shorts-slide"
              }
              data-slide-index={index}
              data-active={isPlaying || undefined}
              style={
                isPlaying
                  ? undefined
                  : {
                      backgroundColor: "#0f0f0f",
                      backgroundImage: `url(${buildYouTubeThumbnailUrl(slide.clip.videoId)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
              }
            >
              <div className="shorts-vignette" aria-hidden="true" />
            </section>
          );
        })}
      </div>

      {activeClip ? (
        <div className="shorts-controls-layer">
          <ShortsMuteButton muted={muted} onToggleMute={toggleMute} />
        </div>
      ) : null}

      {activeClip ? (
        <ShortsChrome
          clip={activeClip}
          activePosition={logicalPosition}
          total={clips.length}
          onAbout={onAbout}
          enableAbout={enableAbout}
          votes={voteState[activeClip.id] ?? EMPTY_VOTES}
          onReact={(reaction) => {
            void handleReact(activeClip.id, reaction);
          }}
        />
      ) : null}

      {scrollCueVisible ? (
        <p className="feed-scroll-cue" aria-hidden="true">
          <span className="feed-scroll-cue-label">Scroll the feed</span>
          <span className="feed-scroll-cue-chevron">↓</span>
        </p>
      ) : null}
    </div>
  );
}

export const ShortsFeed = forwardRef(ShortsFeedComponent);
