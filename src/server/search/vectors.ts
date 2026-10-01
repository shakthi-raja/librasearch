import "server-only";
import { env } from "@/lib/config/env";
import { connectedRedis } from "@/server/redis";
import { embedQuery } from "@/server/vector/embedding";
import { digest } from "./cache";

const WEEK = 7 * 24 * 3600;

/** In this process, by normalised text; the promise is shared while it runs. */
const recent = new Map<string, Promise<number[]>>();

const encode = (vector: number[]) =>
  Buffer.from(new Float32Array(vector).buffer).toString("base64");

const decode = (value: string) => {
  const bytes = Buffer.from(value, "base64");
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
};

async function fromRedisOrModel(text: string): Promise<number[]> {
  const key = `search:vector:${digest([env().EMBEDDING_MODEL, text])}`;
  const client = await connectedRedis();
  if (!client) return embedQuery(text);
  try {
    const hit = await client.get(key);
    if (hit) return decode(hit);
  } catch {
    return embedQuery(text);
  }
  const vector = await embedQuery(text);
  client.set(key, encode(vector), "EX", WEEK).catch(() => undefined);
  return vector;
}

/**
 * The query's vector. Embedding takes tens of milliseconds and the same
 * queries come back all week, so vectors are kept in Redis as float32.
 */
export function queryVector(text: string): Promise<number[]> {
  const key = text.trim().toLowerCase();
  let vector = recent.get(key);
  if (!vector) {
    vector = fromRedisOrModel(key);
    recent.set(key, vector);
    vector.catch(() => recent.delete(key));
    if (recent.size > 500) recent.delete(recent.keys().next().value as string);
  }
  return vector;
}
