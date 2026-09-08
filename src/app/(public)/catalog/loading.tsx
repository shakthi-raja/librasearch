import { TableSkeleton } from "@/components/data/table-skeleton";

export default function Loading() {
  return (
    <div className="grid gap-[var(--space-xl)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <TableSkeleton rows={10} columns={1} />
      </div>
      <TableSkeleton rows={12} columns={5} />
    </div>
  );
}
