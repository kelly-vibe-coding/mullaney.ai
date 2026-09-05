import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommentsOffSnackbar } from "./comments-off-snackbar";

describe("CommentsOffSnackbar", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the turned-off message and auto-dismisses", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<CommentsOffSnackbar open onClose={onClose} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Comments are turned off",
    );

    vi.advanceTimersByTime(2800);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render when closed", () => {
    render(<CommentsOffSnackbar open={false} onClose={() => undefined} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("restarts the auto-dismiss timer when reopened", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { rerender } = render(
      <CommentsOffSnackbar open onClose={onClose} />,
    );

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    rerender(<CommentsOffSnackbar open={false} onClose={onClose} />);
    rerender(<CommentsOffSnackbar open onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(2799);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
