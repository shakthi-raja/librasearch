import type { Metadata } from "next";
import { Kiosk } from "@/components/kiosk/kiosk";

export const metadata: Metadata = { title: "Self-checkout" };

export default function KioskPage() {
  return <Kiosk />;
}
