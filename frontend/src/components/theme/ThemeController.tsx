"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/theme-store";

const storageKey = "orbit-theme";

export function ThemeController() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedMode = window.localStorage.getItem(storageKey);
    const nextMode =
      savedMode === "light" || savedMode === "dark"
        ? savedMode
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.classList.toggle("dark", nextMode === "dark");
    window.localStorage.setItem(storageKey, nextMode);
    setMode(nextMode);
    setIsReady(true);
  }, [setMode]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    document.documentElement.classList.toggle("dark", mode === "dark");
    window.localStorage.setItem(storageKey, mode);
  }, [isReady, mode]);

  return null;
}
