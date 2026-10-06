import { currentUser } from "@/server/auth/current";
import { listenLive } from "@/server/live";

export const dynamic = "force-dynamic";

/** Server-sent events for the signed-in member: holds that become ready, new notices. */
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return new Response("Sign in to receive live updates.", { status: 401 });

  const encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          stop();
        }
      };
      const unsubscribe = listenLive(user.userId, user.role, (event) => {
        write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      });
      // proxies close quiet connections; a comment every 25 seconds keeps it open
      const beat = setInterval(() => write(": keep-alive\n\n"), 25_000);
      stop = () => {
        clearInterval(beat);
        unsubscribe();
      };
      request.signal.addEventListener("abort", () => {
        stop();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
      write("retry: 5000\n\n");
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
