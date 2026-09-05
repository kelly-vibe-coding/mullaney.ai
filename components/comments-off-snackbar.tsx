"use client";

import { useEffect } from "react";

const AUTO_DISMISS_MS = 2800;

export interface CommentsOffSnackbarProps {
  open: boolean;
  onClose: () => void;
}

export function CommentsOffSnackbar({ open, onClose }: CommentsOffSnackbarProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(onClose, AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="comments-off-snackbar"
      role="status"
      aria-live="polite"
    >
      Comments are turned off
    </div>
  );
}
