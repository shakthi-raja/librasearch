import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { MarkReadButton } from "@/components/notices/mark-read";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { memberNotices } from "@/server/services/notices";

export const metadata: Metadata = { title: "Notices" };

export default async function NoticesPage() {
  const user = await requireUser("STUDENT", "FACULTY", "LIBRARIAN");
  const { unread, notices } = await memberNotices(user.userId, user.role);

  return (
    <>
      <PageHeader
        title="Notices"
        description="Messages from the library desk. Unread ones are marked."
      />

      <p className="text-muted mb-[var(--space-md)] text-sm">
        {unread === 0 ? "Nothing unread." : `${unread} unread.`}
      </p>

      {notices.length === 0 ? (
        <p className="text-muted">The desk has not sent you anything yet.</p>
      ) : (
        <ol className="ruled max-w-[62rem]">
          {notices.map((notice) => (
            <li key={notice.id} className="py-[var(--space-md)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg">{notice.title}</h2>
                <span className={notice.readAt ? "chip" : "chip chip-signal"}>
                  {notice.readAt ? "Read" : "Unread"}
                </span>
              </div>
              <p className="mt-1 text-sm">{notice.body}</p>
              <p className="text-muted mt-1 text-xs">
                {formatDateTime(new Date(notice.createdAt))}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {notice.link ? (
                  <Link href={notice.link as Route} className="text-sm">
                    Open
                  </Link>
                ) : null}
                {notice.readAt === null ? <MarkReadButton noticeId={notice.id} /> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
