/** Placeholder rows in the shape of the table that is loading. */
export function TableSkeleton({ rows = 8, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="ruled" role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
          key={r}
          className="grid gap-[var(--space-md)] py-[var(--space-sm)]"
          style={{ gridTemplateColumns: `2fr repeat(${columns - 1}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, c) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder cells
            <span key={c} className="skeleton h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
