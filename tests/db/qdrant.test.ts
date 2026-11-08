import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  COLLECTIONS,
  collectionInfo,
  dropCollections,
  ensureCollections,
  qdrantReady,
  vectorSize,
} from "@/server/vector/qdrant";

const ready = await qdrantReady();
const prefix = "probe_";

describe.skipIf(!ready)("qdrant collections", () => {
  beforeAll(async () => {
    await dropCollections(prefix);
    await ensureCollections(prefix);
  });

  afterAll(async () => {
    await dropCollections(prefix);
  });

  it("creates each collection with the shared vector shape", async () => {
    for (const base of Object.keys(COLLECTIONS) as (keyof typeof COLLECTIONS)[]) {
      const info = await collectionInfo(base, prefix);
      expect(info.config?.params?.vectors).toMatchObject({
        size: vectorSize(),
        distance: "Cosine",
      });
    }
  });

  it("creates the payload indexes the queries filter on", async () => {
    for (const [base, spec] of Object.entries(COLLECTIONS)) {
      const info = await collectionInfo(base as keyof typeof COLLECTIONS, prefix);
      const fields = Object.keys(info.payload_schema ?? {});
      for (const index of spec.payloadIndexes) {
        expect(fields, `${base} ${index.field}`).toContain(index.field);
      }
    }
  });
});
