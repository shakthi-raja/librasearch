import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Mono, Red_Hat_Text } from "next/font/google";
import type { ReactNode } from "react";
import { MODE_SCRIPT } from "@/components/layout/mode-toggle";
import "./globals.css";

const display = Red_Hat_Display({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-red-hat-display",
  display: "swap",
});
const text = Red_Hat_Text({ subsets: ["latin"], variable: "--font-red-hat-text", display: "swap" });
const mono = Red_Hat_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-red-hat-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "LibraSearch", template: "%s | LibraSearch" },
  description: "Find the chapter your syllabus means, and the copy on the shelf.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${text.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static mode script, no user input */}
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
