"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";

import type { FeedClip } from "@/lib/feed";

export type PlayerControls = {
  applyMute: (muted: boolean) => void;
  togglePause: () => void;
  pause: () => void;
};

type YtPlayer = {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
};

type YtPlayerEvent = {
  target: YtPlayer;
};

type YtPlayerStateEvent = YtPlayerEvent & {
  data: number;
};

type YtNamespace = {
  PlayerState: {
    ENDED: 0;
    PLAYING: 1;
  };
  Player: new (
    element: string | HTMLElement,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: YtPlayerEvent) => void;
        onStateChange?: (event: YtPlayerStateEvent) => void;
      };
    },
  ) => YtPlayer;
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YtNamespace> | null = null;

function loadYouTubeApi(): Promise<YtNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser"));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT) {
          resolve(window.YT);
        }
      };

      if (!document.querySelector("script[data-youtube-iframe-api]")) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.dataset.youtubeIframeApi = "";
        document.head.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

const GLYPH = {
  volumeUp:
    "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  volumeOff:
    "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
} as const;

function VolumeGlyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function ShortsMuteButton({
  muted,
  onToggleMute,
}: {
  muted: boolean;
  onToggleMute: () => void;
}) {
  function handleMutePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  function handleMuteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();
    onToggleMute();
  }

  return (
    <button
      type="button"
      className="shorts-mute-btn focus-ring"
      data-no-pause=""
      aria-pressed={muted}
      aria-label={muted ? "Unmute" : "Mute"}
      onPointerDown={handleMutePointerDown}
      onClick={handleMuteClick}
    >
      <VolumeGlyph d={muted ? GLYPH.volumeOff : GLYPH.volumeUp} />
    </button>
  );
}

// Keep one iframe alive; recreating it loses the user's autoplay unlock.
export function YouTubeEmbed({
  clip,
  title,
  muted,
  onEnded,
  playerApiRef,
}: {
  clip: FeedClip;
  title: string;
  muted: boolean;
  onEnded: () => void;
  playerApiRef?: React.MutableRefObject<PlayerControls | null>;
}) {
  const reactId = useId();
  const hostId = `yt-host-${reactId.replace(/:/g, "")}`;
  const playerRef = useRef<YtPlayer | null>(null);
  const videoIdRef = useRef(clip.videoId);
  const mutedRef = useRef(muted);
  const onEndedRef = useRef(onEnded);
  const pausedRef = useRef(false);
  const endedHandledRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) {
          return;
        }

        const host = document.getElementById(hostId);
        if (!host) {
          return;
        }

        if (playerRef.current) {
          if (videoIdRef.current !== clip.videoId) {
            videoIdRef.current = clip.videoId;
            endedHandledRef.current = false;
            pausedRef.current = false;
            setPaused(false);
            playerRef.current.loadVideoById(clip.videoId);
            if (mutedRef.current) {
              playerRef.current.mute();
            } else {
              playerRef.current.unMute();
            }
            playerRef.current.playVideo();
          }
          return;
        }

        videoIdRef.current = clip.videoId;
        pausedRef.current = false;
        endedHandledRef.current = false;
        setPaused(false);

        new YT.Player(host, {
          videoId: clip.videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            // Browsers block unmuted autoplay. Apply session mute after ready.
            mute: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            controls: 0,
            fs: 0,
            enablejsapi: 1,
            origin:
              typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                return;
              }

              const player = event.target;
              playerRef.current = player;

              const controls: PlayerControls = {
                applyMute: (nextMuted) => {
                  if (nextMuted) {
                    player.mute();
                  } else {
                    player.unMute();
                    if (!pausedRef.current) {
                      player.playVideo();
                    }
                  }
                },
                togglePause: () => {
                  if (pausedRef.current) {
                    player.playVideo();
                    pausedRef.current = false;
                    setPaused(false);
                  } else {
                    player.pauseVideo();
                    pausedRef.current = true;
                    setPaused(true);
                  }
                },
                pause: () => {
                  player.pauseVideo?.();
                  pausedRef.current = true;
                  setPaused(true);
                },
              };

              if (playerApiRef) {
                playerApiRef.current = controls;
              }

              controls.applyMute(mutedRef.current);
              if (!pausedRef.current) {
                player.playVideo();
              }
              setLoaded(true);

              const iframe = document.getElementById(
                hostId,
              ) as HTMLIFrameElement | null;
              if (iframe?.tagName === "IFRAME") {
                iframe.title = title;
                iframe.setAttribute(
                  "allow",
                  "autoplay; encrypted-media",
                );
              }
            },
            // Do not close over `cancelled` — this player outlives effect
            // re-runs (loadVideoById). Stale cancelled=true killed ENDED→next.
            onStateChange: (event) => {
              if (pausedRef.current) {
                return;
              }

              if (event.data === YT.PlayerState.PLAYING) {
                endedHandledRef.current = false;
                return;
              }

              if (
                event.data !== YT.PlayerState.ENDED ||
                endedHandledRef.current
              ) {
                return;
              }

              endedHandledRef.current = true;
              onEndedRef.current();
            },
          },
        });
      })
      .catch(() => {
        // API script load failed; slide stays on thumbnail.
      });

    return () => {
      cancelled = true;
    };
  }, [clip.videoId, hostId, playerApiRef, title]);

  useEffect(() => {
    const iframe = document.getElementById(hostId);
    if (iframe?.tagName === "IFRAME") {
      iframe.setAttribute("title", title);
    }
  }, [hostId, title]);

  useEffect(() => {
    return () => {
      if (playerApiRef) {
        playerApiRef.current = null;
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [playerApiRef]);

  return (
    <>
      <div className="shorts-yt-frame" data-muted={muted || undefined}>
        <div id={hostId} className="shorts-yt-host" />
      </div>
      {paused ? (
        <span className="shorts-pause-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </span>
      ) : null}
      {loaded ? (
        <span className="visually-hidden" role="status">
          Video loaded
        </span>
      ) : null}
    </>
  );
}
