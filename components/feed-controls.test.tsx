import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedControls } from "./feed-controls";

describe("FeedControls", () => {
  afterEach(() => {
    cleanup();
  });

  it("pages from accessible Previous/Next buttons", () => {
    const onPage = vi.fn();
    render(<FeedControls onPage={onPage} flashTick={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous Short" }));
    fireEvent.click(screen.getByRole("button", { name: "Next Short" }));

    expect(onPage).toHaveBeenNthCalledWith(1, -1);
    expect(onPage).toHaveBeenNthCalledWith(2, 1);
  });

  it("pulses the Next chevron when flashTick is non-zero", () => {
    const { rerender } = render(<FeedControls onPage={vi.fn()} flashTick={0} />);
    expect(
      screen.getByRole("button", { name: "Next Short" }).querySelector(
        ".feed-chevron-flash-pulse",
      ),
    ).toBeNull();

    rerender(<FeedControls onPage={vi.fn()} flashTick={1} />);
    expect(
      screen.getByRole("button", { name: "Next Short" }).querySelector(
        ".feed-chevron-flash-pulse",
      ),
    ).not.toBeNull();
  });
});
