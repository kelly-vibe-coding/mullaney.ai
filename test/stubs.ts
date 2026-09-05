import { vi } from "vitest";

type MatchMediaMatches = boolean | ((query: string) => boolean);

export function stubMatchMedia(matches: MatchMediaMatches = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: typeof matches === "function" ? matches(query) : matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: readonly number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

export function stubViewportApis(matches: MatchMediaMatches = false) {
  stubMatchMedia(matches);
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
}

export type MockYouTubePlayer = {
  mute: ReturnType<typeof vi.fn>;
  unMute: ReturnType<typeof vi.fn>;
  playVideo: ReturnType<typeof vi.fn>;
  pauseVideo: ReturnType<typeof vi.fn>;
  loadVideoById: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  emitStateChange: (data: number) => void;
};

export function stubYouTubeApi() {
  const players: MockYouTubePlayer[] = [];

  class MockPlayerCtor {
    mute = vi.fn();
    unMute = vi.fn();
    playVideo = vi.fn();
    pauseVideo = vi.fn();
    loadVideoById = vi.fn();
    destroy = vi.fn();
    emitStateChange: (data: number) => void;

    constructor(
      element: string | HTMLElement,
      options: {
        videoId: string;
        events?: {
          onReady?: (event: { target: MockPlayerCtor }) => void;
          onStateChange?: (event: {
            data: number;
            target: MockPlayerCtor;
          }) => void;
        };
      },
    ) {
      this.emitStateChange = (data) => {
        options.events?.onStateChange?.({ data, target: this });
      };

      const host =
        typeof element === "string"
          ? document.getElementById(element)
          : element;
      if (!host) {
        throw new Error("YouTube host element missing");
      }

      const iframe = document.createElement("iframe");
      iframe.id = host.id;
      iframe.src = `https://www.youtube.com/embed/${options.videoId}?autoplay=1&mute=1`;
      host.replaceWith(iframe);

      players.push(this);

      queueMicrotask(() => {
        options.events?.onReady?.({ target: this });
      });
    }
  }

  window.YT = {
    PlayerState: {
      ENDED: 0,
      PLAYING: 1,
    },
    Player: MockPlayerCtor as unknown as NonNullable<typeof window.YT>["Player"],
  };

  return { players };
}
