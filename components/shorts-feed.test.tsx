import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeedClip } from "@/lib/feed";
import { getInitialLoopIndex } from "@/lib/feed-loop";
import { stubMatchMedia, stubYouTubeApi } from "@/test/stubs";

import { ShortsFeed, type ShortsFeedControls } from "./shorts-feed";

const clips = [
  {
    id: "first",
    videoId: "dQw4w9WgXcQ",
    topic: "Test",
    channelName: "One",
    handle: "@one",
    caption: "first caption",
  },
  {
    id: "second",
    videoId: "9bZkp7q19f0",
    topic: "Test",
    channelName: "Two",
    handle: "@two",
    caption: "second caption",
  },
] as const satisfies readonly FeedClip[];

const startIndex = getInitialLoopIndex(clips.length);

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  observed: Element[];
};

function stubIntersectionObserver() {
  const records: ObserverRecord[] = [];

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null;
    readonly rootMargin = "";
    readonly scrollMargin = "";
    readonly thresholds: readonly number[] = [];
    private readonly observed: Element[] = [];

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.root = options?.root ?? null;
      records.push({ callback, observed: this.observed });
    }

    observe(element: Element) {
      this.observed.push(element);
    }

    unobserve(element: Element) {
      const index = this.observed.indexOf(element);
      if (index >= 0) {
        this.observed.splice(index, 1);
      }
    }

    disconnect() {
      this.observed.length = 0;
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

  return {
    activate(element: Element) {
      for (const record of records) {
        if (!record.observed.includes(element)) {
          continue;
        }

        record.callback(
          [
            {
              isIntersecting: true,
              intersectionRatio: 0.8,
              target: element,
              time: 0,
              boundingClientRect: element.getBoundingClientRect(),
              intersectionRect: element.getBoundingClientRect(),
              rootBounds: null,
            } as IntersectionObserverEntry,
          ],
          record as unknown as IntersectionObserver,
        );
      }
    },
  };
}

function getSlide(index: number) {
  const slide = document.querySelector(`[data-slide-index="${index}"]`);
  if (!(slide instanceof HTMLElement)) {
    throw new Error(`slide ${index} was not observed`);
  }
  return slide;
}

function stubVotesFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }),
  );
}

describe("ShortsFeed", () => {
  afterEach(() => {
    cleanup();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps the scroll feed above the player so mobile swipe owns the gesture", async () => {
    stubVotesFetch();
    stubIntersectionObserver();
    stubYouTubeApi();

    const { container } = render(
      <ShortsFeed clips={clips} onAbout={() => undefined} />,
    );

    const player = container.querySelector(".shorts-player-layer");
    const feed = container.querySelector(".shorts-feed");
    const mute = screen.getByRole("button", { name: "Unmute" });
    const active = getSlide(startIndex);

    expect(player && feed).toBeTruthy();
    expect(
      (player!.compareDocumentPosition(feed!) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
        0,
    ).toBe(true);
    expect(player!.contains(mute)).toBe(false);
    expect(active).toHaveClass("shorts-slide--playing");
  });

  it("mounts one live iframe and swaps it when another slide becomes active", async () => {
    stubVotesFetch();
    const observer = stubIntersectionObserver();
    stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    await waitFor(() => {
      expect(
        screen.getByTitle("YouTube Short 1 of 2: first caption"),
      ).toBeInTheDocument();
    });
    expect(document.querySelectorAll("iframe")).toHaveLength(1);

    await act(async () => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 60);
      });
      observer.activate(getSlide(startIndex + 1));
    });

    await waitFor(() => {
      expect(
        screen.getByTitle("YouTube Short 2 of 2: second caption"),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTitle("YouTube Short 1 of 2: first caption"),
    ).not.toBeInTheDocument();
    expect(document.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("keeps inactive slides on a dark thumbnail fallback", () => {
    stubVotesFetch();
    stubIntersectionObserver();
    stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    const inactive = getSlide(startIndex + 1);

    expect(inactive.style.backgroundImage).toContain(
      "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    );
    expect(inactive.style.backgroundColor).toBe("rgb(15, 15, 15)");
  });

  it("starts the session muted and toggles mute through the player API", async () => {
    stubVotesFetch();
    stubIntersectionObserver();
    const { players } = stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    await waitFor(() => {
      expect(players[0]?.playVideo).toHaveBeenCalled();
    });

    const frame = document.querySelector(".shorts-yt-frame");
    expect(frame).toHaveAttribute("data-muted");
    expect(players[0]?.mute).toHaveBeenCalled();

    const unmute = screen.getByRole("button", { name: "Unmute" });
    expect(unmute).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(unmute);

    expect(screen.getByRole("button", { name: "Mute" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(frame).not.toHaveAttribute("data-muted");
    expect(players[0]?.unMute).toHaveBeenCalled();
    expect(players[0]?.playVideo.mock.calls.length).toBeGreaterThan(1);
  });

  it("keeps the mute choice while scrolling to another Short", async () => {
    stubVotesFetch();
    const observer = stubIntersectionObserver();
    const { players } = stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    await waitFor(() => {
      expect(players[0]?.playVideo).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(players[0]?.unMute).toHaveBeenCalled();

    await act(async () => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 60);
      });
      observer.activate(getSlide(startIndex + 1));
    });

    await waitFor(() => {
      expect(players[0]?.loadVideoById).toHaveBeenCalled();
    });

    // Recreating the player would lose the autoplay unlock.
    expect(players).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
    expect(document.querySelector(".shorts-yt-frame")).not.toHaveAttribute(
      "data-muted",
    );
  });

  it("pauses and resumes on a stationary tap without treating a swipe as a tap", async () => {
    stubVotesFetch();
    stubIntersectionObserver();
    const { players } = stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    await waitFor(() => {
      expect(players[0]?.playVideo).toHaveBeenCalled();
    });

    const slide = getSlide(startIndex);

    fireEvent.touchStart(slide, {
      touches: [{ clientX: 40, clientY: 40 }],
    });
    fireEvent.touchEnd(slide, {
      changedTouches: [{ clientX: 42, clientY: 41 }],
    });

    expect(players[0]?.pauseVideo).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".shorts-pause-badge")).toBeInTheDocument();

    fireEvent.touchStart(slide, {
      touches: [{ clientX: 40, clientY: 40 }],
    });
    fireEvent.touchMove(slide, {
      touches: [{ clientX: 44, clientY: 90 }],
    });
    fireEvent.touchEnd(slide, {
      changedTouches: [{ clientX: 44, clientY: 90 }],
    });

    expect(players[0]?.pauseVideo).toHaveBeenCalledTimes(1);

    fireEvent.touchStart(slide, {
      touches: [{ clientX: 50, clientY: 50 }],
    });
    fireEvent.touchEnd(slide, {
      changedTouches: [{ clientX: 50, clientY: 50 }],
    });

    expect(players[0]?.playVideo.mock.calls.length).toBeGreaterThan(1);
    expect(document.querySelector(".shorts-pause-badge")).not.toBeInTheDocument();
  });

  it("keeps tap-to-pause working after unmute", async () => {
    stubVotesFetch();
    stubIntersectionObserver();
    const { players } = stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    await waitFor(() => {
      expect(players[0]?.playVideo).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(players[0]?.unMute).toHaveBeenCalled();

    fireEvent.click(getSlide(startIndex));

    expect(players[0]?.pauseVideo).toHaveBeenCalled();
    expect(document.querySelector(".shorts-pause-badge")).toBeInTheDocument();
  });

  it("announces Video loaded after the active player is ready", async () => {
    stubVotesFetch();
    stubIntersectionObserver();
    stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    expect(screen.queryByText("Video loaded")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Video loaded")).toHaveClass("visually-hidden");
    });
  });

  it("scrolls to the next Short once when the active video ends", async () => {
    stubVotesFetch();
    stubIntersectionObserver();
    stubMatchMedia();
    const { players } = stubYouTubeApi();

    render(<ShortsFeed clips={clips} onAbout={() => undefined} />);

    await waitFor(() => {
      expect(players[0]?.playVideo).toHaveBeenCalled();
    });

    const nextSlide = getSlide(startIndex + 1);
    nextSlide.scrollIntoView = vi.fn();

    act(() => {
      players[0]?.emitStateChange(0);
      players[0]?.emitStateChange(0);
    });

    expect(nextSlide.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(nextSlide.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("exposes reduced-motion-aware previous and next paging controls", () => {
    stubVotesFetch();
    stubIntersectionObserver();
    stubMatchMedia(true);
    stubYouTubeApi();
    const controls = createRef<ShortsFeedControls>();

    render(
      <ShortsFeed
        ref={controls}
        clips={clips}
        onAbout={() => undefined}
      />,
    );

    const previousSlide = getSlide(startIndex - 1);
    const nextSlide = getSlide(startIndex + 1);
    previousSlide.scrollIntoView = vi.fn();
    nextSlide.scrollIntoView = vi.fn();

    act(() => {
      controls.current?.page(-1);
      controls.current?.page(1);
    });

    expect(previousSlide.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(nextSlide.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("does not auto-advance a paused video or while About is open", async () => {
    stubVotesFetch();
    stubIntersectionObserver();
    stubMatchMedia();
    const { players } = stubYouTubeApi();
    const { rerender } = render(
      <ShortsFeed clips={clips} onAbout={() => undefined} />,
    );

    await waitFor(() => {
      expect(players[0]?.playVideo).toHaveBeenCalled();
    });

    const nextSlide = getSlide(startIndex + 1);
    nextSlide.scrollIntoView = vi.fn();

    fireEvent.click(getSlide(startIndex));
    act(() => {
      players[0]?.emitStateChange(0);
    });
    expect(nextSlide.scrollIntoView).not.toHaveBeenCalled();

    fireEvent.click(getSlide(startIndex));
    rerender(
      <ShortsFeed clips={clips} onAbout={() => undefined} aboutOpen />,
    );
    act(() => {
      players[0]?.emitStateChange(0);
    });
    expect(nextSlide.scrollIntoView).not.toHaveBeenCalled();
  });

});
