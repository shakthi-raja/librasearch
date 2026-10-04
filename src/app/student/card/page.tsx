import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { CardRefresh } from "@/components/student/card-refresh";
import { env } from "@/lib/config/env";
import { issueCardToken } from "@/server/auth/card";
import { requireUser } from "@/server/auth/current";
import { qrDataUri } from "@/server/labels";

export const metadata: Metadata = { title: "Library card" };

export default async function CardPage() {
  const user = await requireUser("STUDENT", "FACULTY");
  const card = issueCardToken(user.universityId, env().CARD_SECRET);
  const qr = await qrDataUri(card.qr);

  return (
    <>
      <PageHeader
        title="Library card"
        description="Show this at the desk or a self-checkout kiosk instead of typing your ID."
      />
      <div className="grid max-w-[22rem] gap-[var(--space-md)] rounded-[var(--radius-entry)] border border-ink bg-paper-2 p-[var(--space-lg)]">
        <div className="grid gap-0.5">
          <p className="text-lg font-medium">{user.fullName}</p>
          <p className="figure text-sm text-muted">{user.universityId}</p>
        </div>
        {/* biome-ignore lint/performance/noImgElement: a generated SVG data URI, not a remote image */}
        <img
          src={qr}
          alt={`Library card code for ${user.universityId}`}
          className="w-full bg-white p-3"
        />
        <CardRefresh expiresAt={card.expiresAt.toISOString()} />
      </div>
      <p className="mt-[var(--space-md)] max-w-[44ch] text-sm text-muted">
        The code changes every few minutes, so a screenshot of it will not work for long. Turn your
        screen brightness up if the scanner struggles.
      </p>
    </>
  );
}
