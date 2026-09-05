import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeedClip } from "@/lib/feed";

import { ShortsChrome } from "./shorts-chrome";

const clip = {
  id: "first",
  videoId: "dQw4w9WgXcQ",
  topic: "Test",
  channelName: "One",
  handle: "@one",
  caption: "first caption",
} as const satisfies FeedClip;

describe("ShortsChrome", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows vote counts and toggles like state", () => {
    const onReact = vi.fn();

    render(
      <ShortsChrome
        clip={clip}
        activePosition={1}
        total={2}
        onAbout={() => undefined}
        votes={{ like: 4, dislike: 1, reaction: null }}
        onReact={onReact}
      />,
    );

    expect(screen.getByRole("button", { name: "Like this Short" })).toHaveTextContent(
      "4",
    );
    expect(
      screen.getByRole("button", { name: "Dislike this Short" }),
    ).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Like this Short" }));
    expect(onReact).toHaveBeenCalledWith("like");
  });

  it("shows the comments-off snackbar when comments is tapped", () => {
    render(
      <ShortsChrome
        clip={clip}
        activePosition={1}
        total={2}
        onAbout={() => undefined}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Comments (turned off)" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Comments are turned off",
    );
  });

  it("keeps Me as display-only when enableAbout is false", () => {
    render(
      <ShortsChrome
        clip={clip}
        activePosition={1}
        total={2}
        onAbout={() => undefined}
        enableAbout={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Me (display only)" }),
    ).not.toHaveAttribute("aria-haspopup");
  });
});
