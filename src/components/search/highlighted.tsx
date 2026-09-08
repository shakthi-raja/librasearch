import { highlight } from "@/lib/search/highlight";

/** Text with query terms marked, built as elements so no markup is injected. */
export function Highlighted({ text, terms, max }: { text: string; terms: string[]; max?: number }) {
  return (
    <>
      {highlight(text, terms, max).map((segment, i) =>
        segment.hit ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and static
          <mark key={i} className="rounded-[2px] bg-accent-soft px-0.5 text-ink">
            {segment.text}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and static
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}
