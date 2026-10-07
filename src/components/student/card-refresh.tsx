"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Counts down the card's code and fetches a fresh one before it lapses. */
export function CardRefresh({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const expiry = new Date(expiresAt).getTime();
    const tick = () => {
      const seconds = Math.max(0, Math.round((expiry - Date.now()) / 1000));
      setLeft(seconds);
      if (seconds <= 30) router.refresh();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, router]);

  if (left === null) return null;
  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, "0");
  return (
    <p className="text-xs text-muted" aria-live="off">
      This code renews itself; it stops working in {minutes}:{seconds}.
    </p>
  );
}
