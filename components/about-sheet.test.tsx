import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeedClip } from "@/lib/feed";
import { stubViewportApis, stubYouTubeApi } from "@/test/stubs";

import { AboutSheet } from "./about-sheet";
import { ShortsShell } from "./shorts-shell";

const shellClips = [
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

function AboutHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        About
      </button>
      <button type="button">Feed control</button>
      <AboutSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

describe("AboutSheet", () => {
  afterEach(() => {
    cleanup();
  });

  it("is aria-hidden when closed and does not trap feed focus", () => {
    render(<AboutHarness />);

    const dialog = screen.getByRole("dialog", { hidden: true });

    expect(dialog).toHaveAttribute("aria-label", "About Kelly Mullaney");
    expect(dialog).toHaveAttribute("aria-hidden", "true");

    const feedControl = screen.getByRole("button", { name: "Feed control" });
    feedControl.focus();

    expect(feedControl).toHaveFocus();
    expect(dialog).toHaveAttribute("inert");
  });

  it("opens a dialog labeled About Kelly Mullaney when About is clicked", async () => {
    const user = userEvent.setup();
    render(<AboutHarness />);

    await user.click(screen.getByRole("button", { name: /^About$/ }));

    expect(
      screen.getByRole("dialog", { name: "About Kelly Mullaney" }),
    ).toBeInTheDocument();
  });

  it("renders the compact Bio inside the sheet", async () => {
    const user = userEvent.setup();
    render(<AboutHarness />);

    await user.click(screen.getByRole("button", { name: /^About$/ }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Kelly Mullaney" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".bio")).toHaveAttribute("data-compact");
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<AboutSheet open onClose={onClose} />);
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Back is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<AboutSheet open onClose={onClose} />);
    const backButton = screen.getByRole("button", { name: "Back to feed" });

    expect(backButton).toHaveTextContent("Back");
    await user.click(backButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus to Back on open and returns it to the opener on close", async () => {
    const user = userEvent.setup();
    render(<AboutHarness />);

    const opener = screen.getByRole("button", { name: /^About$/ });
    await user.click(opener);

    expect(screen.getByRole("button", { name: /back/i })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(opener).toHaveFocus();
  });
});

describe("ShortsShell about wiring", () => {
  afterEach(() => {
    cleanup();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens the about sheet from Me and inerts the feed while open", async () => {
    stubViewportApis();
    stubYouTubeApi();
    const user = userEvent.setup();

    render(<ShortsShell clips={shellClips} />);

    const feedHost = document.querySelector(".shorts-feed-host");
    expect(feedHost).not.toHaveAttribute("inert");
    expect(feedHost).not.toHaveAttribute("aria-hidden");

    await user.click(
      screen.getByRole("button", { name: "Me — about Kelly Mullaney" }),
    );

    expect(
      screen.getByRole("dialog", { name: "About Kelly Mullaney" }),
    ).toBeInTheDocument();
    expect(feedHost).toHaveAttribute("inert");
    expect(feedHost).toHaveAttribute("aria-hidden", "true");

    await user.click(screen.getByRole("button", { name: /back/i }));

    const closedDialog = screen.getByRole("dialog", { hidden: true });
    expect(closedDialog).toHaveAttribute("aria-label", "About Kelly Mullaney");
    expect(closedDialog).toHaveAttribute("aria-hidden", "true");
    expect(feedHost).not.toHaveAttribute("inert");
    expect(feedHost).not.toHaveAttribute("aria-hidden");
  });

  it("does not open about from Me on desktop", async () => {
    stubViewportApis((query) => query.includes("min-width: 1024"));
    stubYouTubeApi();
    const user = userEvent.setup();

    render(<ShortsShell clips={shellClips} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Me (display only)" }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Me (display only)" }),
    );

    expect(
      screen.queryByRole("dialog", { name: "About Kelly Mullaney" }),
    ).not.toBeInTheDocument();
  });
});
