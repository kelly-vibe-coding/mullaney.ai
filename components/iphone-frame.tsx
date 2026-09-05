"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
} from "react";

const PHONE_WIDTH = 414;
const PHONE_HEIGHT = 868;
const PHONE_MARGIN_Y = 40;
const PHONE_MARGIN_X = 24;
const SCALE_FLOOR = 0.72;
const LG_BREAKPOINT = 1024;

function formatStatusTime(date: Date): string {
  // Omit AM/PM to fit the iOS status bar.
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "9";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "41";
  return `${hour}:${minute}`;
}

function StatusClock() {
  // Keep the server value stable to avoid a hydration mismatch.
  const [time, setTime] = useState("9:41");

  useEffect(() => {
    function tick() {
      setTime(formatStatusTime(new Date()));
    }

    tick();

    let intervalId = 0;
    const msUntilNextMinute =
      60_000 - (Date.now() % 60_000) + 50;
    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msUntilNextMinute);

    function onVisibility() {
      if (document.visibilityState === "visible") {
        tick();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <span>{time}</span>;
}

function StatusIcons() {
  return (
    <>
      <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff" aria-hidden="true">
        <rect x="0" y="7.5" width="3" height="4.5" rx="1" />
        <rect x="4.6" y="5.2" width="3" height="6.8" rx="1" />
        <rect x="9.2" y="2.6" width="3" height="9.4" rx="1" />
        <rect x="13.8" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="#fff" aria-hidden="true">
        <path d="M8.5 1.6c2.6 0 5 1 6.8 2.6l1.3-1.4A11.4 11.4 0 008.5 0C5.3 0 2.4 1.2.2 3.2L1.5 4.6A9.6 9.6 0 018.5 1.6zm0 3.6c1.6 0 3.1.6 4.2 1.6l1.3-1.4a8 8 0 00-11 0l1.3 1.4a6.2 6.2 0 014.2-1.6zM8.5 8.8c.8 0 1.5.3 2 .8L8.5 12 6.4 9.6c.6-.5 1.3-.8 2.1-.8z" />
      </svg>
      <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
        <rect
          x=".5"
          y=".5"
          width="22"
          height="12"
          rx="3.6"
          fill="none"
          stroke="rgba(255,255,255,.45)"
        />
        <rect x="2.2" y="2.2" width="15" height="8.6" rx="2.2" fill="#fff" />
        <path
          d="M24.4 4.4v4.2c1-.4 1.6-1.1 1.6-2.1s-.6-1.7-1.6-2.1z"
          fill="rgba(255,255,255,.45)"
        />
      </svg>
    </>
  );
}

export function IPhoneFrame({ children }: PropsWithChildren) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phoneScale, setPhoneScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const mediaQuery = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);

    function updateScale() {
      const node = containerRef.current;
      if (!node) {
        return;
      }

      if (!mediaQuery.matches) {
        setPhoneScale(1);
        return;
      }

      // Measuring the scaled child would create a resize feedback loop.
      const fitHeight = (window.innerHeight - PHONE_MARGIN_Y) / PHONE_HEIGHT;
      const fitWidth = (node.clientWidth - PHONE_MARGIN_X) / PHONE_WIDTH;
      const nextScale = Math.max(
        SCALE_FLOOR,
        Math.min(1, fitHeight, fitWidth),
      );

      setPhoneScale(Number(nextScale.toFixed(4)));
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    mediaQuery.addEventListener("change", updateScale);
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", updateScale);
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const phoneStyle = {
    "--phone-scale": phoneScale,
    "--phone-w": `${PHONE_WIDTH}px`,
    "--phone-h": `${PHONE_HEIGHT}px`,
  } as CSSProperties;

  return (
    <div ref={containerRef} className="iphone-viewport">
      <div className="iphone-phone" style={phoneStyle}>
        <div className="iphone-frame">
          <span className="iphone-btn-side iphone-btn-mute" aria-hidden="true" />
          <span className="iphone-btn-side iphone-btn-vol-up" aria-hidden="true" />
          <span className="iphone-btn-side iphone-btn-vol-dn" aria-hidden="true" />
          <span className="iphone-btn-side iphone-btn-power" aria-hidden="true" />

          <div className="iphone-screen">
            <div className="iphone-island" aria-hidden="true" />

            <div className="iphone-statusbar" aria-hidden="true">
              <StatusClock />
              <span className="iphone-statusbar-right">
                <StatusIcons />
              </span>
            </div>

            <div className="shorts-app">{children}</div>

            <div className="iphone-glare" aria-hidden="true" />
            <div className="iphone-home-indicator" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
