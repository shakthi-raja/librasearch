"use client";

import { useState } from "react";

/**
 * A book's cover from Open Library, or a drawn spine with the title when
 * there is none. Covers are decoration next to the title, so they carry no
 * alternative text of their own.
 */
export function BookCover({
  src,
  title,
  size = "md",
}: {
  src: string | null;
  title: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const box = { sm: "w-12", md: "w-20", lg: "w-36" }[size];

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`${box} grid aspect-[2/3] shrink-0 content-end overflow-hidden rounded-[3px] border border-ink bg-paper-3 p-1.5`}
      >
        <span
          className={`line-clamp-4 font-medium leading-tight ${size === "lg" ? "text-sm" : "text-[0.55rem]"}`}
        >
          {title}
        </span>
      </div>
    );
  }
  return (
    // biome-ignore lint/performance/noImgElement: covers come from Open Library as plain images
    <img
      src={src}
      alt=""
      loading={size === "lg" ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${box} aspect-[2/3] shrink-0 rounded-[3px] border border-ink object-cover`}
    />
  );
}
