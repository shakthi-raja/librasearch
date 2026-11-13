import type { Metadata } from "next";
import { NotFoundMessage } from "@/components/layout/not-found-message";

export const metadata: Metadata = { title: "Page not found" };

/** Inside this section's layout, which already draws the header and main. */
export default function SectionNotFound() {
  return <NotFoundMessage />;
}
