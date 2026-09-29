import "server-only";
import { embedQuery } from "@/server/vector/embedding";

/** The query vector, computed once per distinct text in this process. */
const recent = new Map<string, Promise<number[]>>();

export function queryVector(text: string): Promise<number[]> {
  const key = text.trim().toLowerCase();
  let vector = recent.get(key);
  if (!vector) {
    vector = embedQuery(key);
    recent.set(key, vector);
    vector.catch(() => recent.delete(key));
    if (recent.size > 500) recent.delete(recent.keys().next().value as string);
  }
  return vector;
}
