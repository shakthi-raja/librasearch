"use client";

import { useActionState } from "react";
import { markReadAction, type NoticeState } from "@/app/notices/actions";

export function MarkReadButton({ noticeId }: { noticeId: number }) {
  const [state, action, pending] = useActionState<NoticeState, FormData>(markReadAction, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="noticeId" value={noticeId} />
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Marking" : "Mark read"}
      </button>
      {state.error ? (
        <span role="alert" className="text-sm text-error">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
