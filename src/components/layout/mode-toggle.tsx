"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";
const KEY = "ls-mode";

function currentMode(): Mode {
  const set = document.documentElement.dataset.mode;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Runs before first paint so the page never flashes the other mode. */
export const MODE_SCRIPT = `try{var m=localStorage.getItem("${KEY}");if(m==="light"||m==="dark")document.documentElement.dataset.mode=m}catch(e){}`;

export function ModeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    setMode(currentMode());
  }, []);

  const next: Mode = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="btn btn-quiet"
      aria-label={`Switch to ${next} mode`}
      onClick={() => {
        document.documentElement.dataset.mode = next;
        try {
          localStorage.setItem(KEY, next);
        } catch {
          // storage can be blocked; the choice still holds for this page
        }
        setMode(next);
      }}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <circle cx="10" cy="10" r="6.5" className="fill-none stroke-ink" strokeWidth="1.5" />
        <path d="M10 3.5 A6.5 6.5 0 0 1 10 16.5 Z" className="fill-ink" />
      </svg>
    </button>
  );
}
