"use client";

import { ChevronLeft } from "lucide-react";
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";

import { Bio } from "./bio";
import { MeAvatar } from "./me-avatar";

// document.body is unavailable during SSR. Mount the portal after hydration.
const subscribeNoop = () => () => {};

export function AboutSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const backRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) {
      closingRef.current = false;
      return;
    }

    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // iPhone Safari can desync fixed overlays and hit targets after zooming.
    window.scrollTo(0, 0);

    backRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.dataset.aboutOpen = "";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      delete document.documentElement.dataset.aboutOpen;
      opener?.focus();
    };
  }, [open, onClose]);

  function handleBack(event: SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
    // iOS often fires touchend then click — only close once.
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    onClose();
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="about-sheet"
      data-open={open || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="About Kelly Mullaney"
      aria-hidden={!open}
      inert={!open || undefined}
    >
      <div className="about-sheet-head">
        <button
          ref={backRef}
          type="button"
          className="about-sheet-back focus-ring"
          onClick={handleBack}
          onTouchEnd={handleBack}
          aria-label="Back to feed"
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
          <span>Back</span>
        </button>
        <div className="about-sheet-title">About</div>
      </div>
      <div className="about-sheet-body">
        <div className="about-you-card">
          <MeAvatar size={56} className="about-you-ring" />
          <div>
            <div className="about-you-name">Kelly Mullaney</div>
            <div className="about-you-handle">@mullaney.ai</div>
          </div>
        </div>
        <Bio compact />
      </div>
    </div>,
    document.body,
  );
}
