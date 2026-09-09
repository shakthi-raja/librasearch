/** Shelf state in words and a figure, never colour alone. */
export function Availability({
  available,
  total,
  reference,
}: {
  available: number;
  total: number;
  reference?: number;
}) {
  if (total === 0) return <span className="text-muted">No copies yet</span>;
  if (available === 0) {
    return (
      <span className="chip">
        All {total} out{reference ? `, ${reference} to read in the library` : ""}
      </span>
    );
  }
  return (
    <span className="chip chip-in-date tabular-nums">
      {available} of {total} on the shelf
    </span>
  );
}
