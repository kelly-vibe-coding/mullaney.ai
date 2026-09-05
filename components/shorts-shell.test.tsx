import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeedClip } from "@/lib/feed";
import { stubViewportApis, stubYouTubeApi } from "@/test/stubs";

import { ShortsShell } from "./shorts-shell";

const clips = [
  {
    id: "a",
    videoId: "dQw4w9WgXcQ",
    topic: "T",
    channelName: "One",
    handle: "@one",
    caption: "first",
  },
  {
    id: "b",
    videoId: "9bZkp7q19f0",
    topic: "T",
    channelName: "Two",
    handle: "@two",
    caption: "second",
  },
] as const satisfies readonly FeedClip[];

function stubVotesFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
  );
}

describe("ShortsShell", () => {
  afterEach(() => {
    cleanup();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders desktop up/down paging buttons", () => {
    stubVotesFetch();
    stubViewportApis();
    stubYouTubeApi();

    render(<ShortsShell clips={clips} />);

    expect(
      screen.getByRole("button", { name: "Previous Short" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next Short" }),
    ).toBeInTheDocument();
  });

  it("pages the feed from the Next button", () => {
    stubVotesFetch();
    stubViewportApis();
    stubYouTubeApi();

    render(<ShortsShell clips={clips} />);
    fireEvent.click(screen.getByRole("button", { name: "Next Short" }));
    // Feed keeps going; smoke that the control is wired without throwing.
    expect(
      screen.getByRole("button", { name: "Next Short" }),
    ).toBeInTheDocument();
  });
});
