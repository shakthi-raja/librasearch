"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LiveEvent = {
  type: "hold-ready" | "notice";
  title: string;
  body: string;
  link: string | null;
};

/**
 * Listens for the member's live events and shows each as a toast. The page
 * data refreshes at the same time, so unread counts and hold lists agree.
 */
export function LiveEvents() {
  const router = useRouter();
  const [toasts, setToasts] = useState<(LiveEvent & { key: number })[]>([]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const source = new EventSource("/api/v1/events");
    const onEvent = (message: MessageEvent<string>) => {
      try {
        const event = JSON.parse(message.data) as LiveEvent;
        setToasts((list) => [...list.slice(-2), { ...event, key: Date.now() }]);
        router.refresh();
      } catch {
        // ignore anything that is not ours
      }
    };
    source.addEventListener("hold-ready", onEvent);
    source.addEventListener("notice", onEvent);
    return () => source.close();
  }, [router]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((list) => list.slice(1)), 12_000);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-[var(--gutter)] bottom-[var(--space-md)] z-40 grid justify-items-end gap-[var(--space-xs)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.key}
          className="pointer-events-auto grid w-[min(24rem,100%)] gap-1 rounded-[var(--radius-card)] border border-ink bg-paper-2 p-[var(--space-sm)] shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{toast.title}</p>
            <button
              type="button"
              className="text-sm text-muted hover:text-ink"
              onClick={() => setToasts((list) => list.filter((t) => t.key !== toast.key))}
              aria-label="Dismiss"
            >
              Close
            </button>
          </div>
          <p className="text-sm text-ink-2">{toast.body}</p>
          {toast.link ? (
            <Link href={toast.link as Route} className="text-sm underline underline-offset-4">
              Open
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
