import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { stubViewportApis, stubYouTubeApi } from "@/test/stubs";

import HomePage from "./page";

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("composes the bio column with one shorts shell from the registry", async () => {
    stubViewportApis();
    stubYouTubeApi();

    render(<HomePage />);

    const stage = document.querySelector(".home-stage");
    expect(stage).toBeInTheDocument();
    expect(stage).toHaveClass("site-atmosphere");

    const bioColumn = screen.getByRole("region", {
      name: "About Kelly Mullaney",
    });
    expect(bioColumn).toHaveClass("home-bio");
    expect(
      screen.getByRole("heading", { name: "Kelly Mullaney" }),
    ).toBeInTheDocument();

    expect(document.querySelectorAll(".shorts-device")).toHaveLength(1);
    await waitFor(() => {
      expect(document.querySelectorAll("iframe")).toHaveLength(1);
    });
  });
});
