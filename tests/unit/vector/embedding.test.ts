import { describe, expect, it } from "vitest";
import { embedDocument, embedQuery } from "@/server/vector/embedding";
import { loadDotEnv } from "../../support/load-env";

loadDotEnv();

const cosine = (a: number[], b: number[]) =>
  a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);

describe("embedding", () => {
  it("returns normalised 384-d vectors and ranks the related passage first", async () => {
    const [query, related, unrelated] = await Promise.all([
      embedQuery("how do databases avoid duplicate data"),
      embedDocument(
        "Functional dependencies and normal forms remove redundancy from a relational schema.",
      ),
      embedDocument("The reading room closes at eight on weekdays."),
    ]);

    expect(query).toHaveLength(384);
    expect(related).toHaveLength(384);

    const norm = Math.sqrt(query.reduce((sum, value) => sum + value * value, 0));
    expect(norm).toBeCloseTo(1, 3);
    expect(cosine(query, related)).toBeGreaterThan(cosine(query, unrelated));
  }, 180_000);
});
