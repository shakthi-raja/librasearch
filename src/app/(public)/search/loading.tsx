import { TableSkeleton } from "@/components/data/table-skeleton";

export default function Loading() {
  return <TableSkeleton rows={6} columns={1} />;
}
