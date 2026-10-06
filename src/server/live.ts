import "server-only";
import { EventEmitter } from "node:events";
import type { Redis } from "ioredis";
import { env } from "@/lib/config/env";
import { log } from "@/server/log";
import { connectedRedis, redis } from "@/server/redis";
import type { RoleName } from "@/server/repositories/auth";

/** Something a signed-in member should hear about without reloading. */
export type LiveEvent = {
  type: "hold-ready" | "notice";
  title: string;
  body: string;
  link: string | null;
};

export type LiveTarget = { userId: number } | { role: RoleName };

// ioredis prefixes keys, not pub/sub channels, so channels carry the database name
const base = () => `${env().DB_NAME}:live:`;
const channelFor = (target: LiveTarget) =>
  "userId" in target ? `${base()}user:${target.userId}` : `${base()}role:${target.role}`;

/** Best effort: if Redis is down the member still finds it under Notices. */
export async function publishLive(target: LiveTarget, event: LiveEvent) {
  try {
    const client = await connectedRedis();
    await client?.publish(channelFor(target), JSON.stringify(event));
  } catch (error) {
    log.warn({ err: error }, "live event not published");
  }
}

const globalForLive = globalThis as unknown as {
  librasearchLive?: { subscriber: Redis; events: EventEmitter };
};

/** One subscriber connection per process, fanned out to every open stream. */
function hub() {
  if (!globalForLive.librasearchLive) {
    // unlike the command client, the subscriber queues its subscription
    // until it is connected, and ioredis renews it after a reconnect
    const subscriber = redis().duplicate({ enableOfflineQueue: true, maxRetriesPerRequest: null });
    const events = new EventEmitter();
    events.setMaxListeners(0);
    subscriber.psubscribe(`${base()}*`).catch((error: unknown) => {
      log.warn({ err: error }, "live subscription failed");
    });
    subscriber.on("pmessage", (_pattern: string, channel: string, message: string) => {
      try {
        events.emit(channel, JSON.parse(message) as LiveEvent);
      } catch {
        // a malformed message is dropped
      }
    });
    globalForLive.librasearchLive = { subscriber, events };
  }
  return globalForLive.librasearchLive.events;
}

/** Calls back for events to this member or their role, until the returned stop is called. */
export function listenLive(userId: number, role: RoleName, callback: (event: LiveEvent) => void) {
  const events = hub();
  const channels = [channelFor({ userId }), channelFor({ role })];
  for (const channel of channels) events.on(channel, callback);
  return () => {
    for (const channel of channels) events.off(channel, callback);
  };
}
