import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "@/lib/config/env";

export type CollectionName = "chapters" | "books" | "syllabus_units";

type PayloadIndex = { field: string; schema: "integer" | "keyword" };

type CollectionSpec = {
  description: string;
  payloadIndexes: PayloadIndex[];
};

export const COLLECTIONS: Record<CollectionName, CollectionSpec> = {
  chapters: {
    description: "One point per chapter; search, auto-mapping and alternatives",
    payloadIndexes: [
      { field: "book_id", schema: "integer" },
      { field: "category_id", schema: "integer" },
      { field: "language", schema: "keyword" },
      { field: "pub_year", schema: "integer" },
    ],
  },
  books: {
    description: "One point per book; similar books and duplicate checks",
    payloadIndexes: [
      { field: "category_id", schema: "integer" },
      { field: "language", schema: "keyword" },
    ],
  },
  syllabus_units: {
    description: "One point per syllabus unit; auto-mapping and overlap",
    payloadIndexes: [
      { field: "offering_id", schema: "integer" },
      { field: "dept_id", schema: "integer" },
    ],
  },
};

const BASE_NAMES = Object.keys(COLLECTIONS) as CollectionName[];

let client: QdrantClient | undefined;

/** The Qdrant client is lazy so imports from the worker and tests do not connect. */
export function qdrant() {
  const apiKey = env().QDRANT_API_KEY;
  client ??= new QdrantClient({
    url: env().QDRANT_URL,
    ...(apiKey ? { apiKey } : {}),
  });
  return client;
}

export const vectorSize = () => env().EMBEDDING_DIM;

const collectionName = (base: CollectionName, prefix = "") => `${prefix}${base}`;

export async function qdrantReady() {
  try {
    await qdrant().getCollections();
    return true;
  } catch {
    return false;
  }
}

/** Creates any missing collection and its payload indexes. A no-op when ready. */
export async function ensureCollections(prefix = "") {
  for (const base of BASE_NAMES) {
    const name = collectionName(base, prefix);
    const { exists } = await qdrant().collectionExists(name);
    if (exists) continue;

    await qdrant().createCollection(name, {
      vectors: {
        size: vectorSize(),
        distance: "Cosine",
        hnsw_config: { m: 16, ef_construct: 100 },
      },
      on_disk_payload: true,
    });

    for (const index of COLLECTIONS[base].payloadIndexes) {
      await qdrant().createPayloadIndex(name, {
        field_name: index.field,
        field_schema: index.schema,
        wait: true,
      });
    }
  }
}

export async function dropCollections(prefix = "") {
  for (const base of BASE_NAMES) {
    const name = collectionName(base, prefix);
    const { exists } = await qdrant().collectionExists(name);
    if (exists) await qdrant().deleteCollection(name);
  }
}

/** Upserts one point; the payload is the filterable part of the vector. */
export async function upsertPoint(
  collection: CollectionName,
  id: number,
  vector: number[],
  payload: Record<string, unknown>,
) {
  await qdrant().upsert(collectionName(collection), {
    wait: true,
    points: [{ id, vector, payload }],
  });
}

export async function collectionInfo(base: CollectionName, prefix = "") {
  return qdrant().getCollection(collectionName(base, prefix));
}

export async function listCollections() {
  const { collections } = await qdrant().getCollections();
  return collections.map((collection) => collection.name);
}
