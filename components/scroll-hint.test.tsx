import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScrollHint } from "./scroll-hint";

describe("ScrollHint", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("pages the feed from accessible buttons and keeps them after the nudge dismisses", () => {
    const onPage = vi.fn();

    render(<ScrollHint onPage={onPage} />);

    const previous = screen.getByRole("button", { name: "Previous Short" });
    const next = screen.getByRole("button", { name: "Next Short" });

    fireEvent.click(previous);

    expect(onPage).toHaveBeenCalledWith(-1);
    expect(previous).toBeEnabled();
    expect(next).toBeEnabled();
    expect(previous.closest(".phone-scroll-hint")).toHaveClass(
      "phone-scroll-hint--keys-only",
    );
    expect(
      previous.closest(".phone-scroll-hint")?.querySelector(
        ".phone-scroll-hint-nudge",
      ),
    ).toBeNull();

    fireEvent.click(next);
    expect(onPage).toHaveBeenCalledWith(1);
    expect(onPage).toHaveBeenCalledTimes(2);
  });

  it("teaches scroll wheel and arrow keys before the nudge dismisses", () => {
    render(<ScrollHint onPage={vi.fn()} />);
    expect(screen.getByText("Scroll wheel or ↑↓")).toBeInTheDocument();
    expect(
      document.querySelector(".phone-scroll-hint-wheel"),
    ).toBeInTheDocument();
  });
});
