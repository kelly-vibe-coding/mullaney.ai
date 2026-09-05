"use client";

import { useEffect } from "react";

export function HomeScrollLock() {
  useEffect(() => {
    document.documentElement.classList.add("home-scroll-lock");
    document.body.classList.add("home-scroll-lock");

    return () => {
      document.documentElement.classList.remove("home-scroll-lock");
      document.body.classList.remove("home-scroll-lock");
    };
  }, []);

  return null;
}
