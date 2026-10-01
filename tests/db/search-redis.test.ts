import type { Connection } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { trendingKey } from "@/lib/search/cache-keys";
import { redis } from "@/server/redis";
import { cached } from "@/server/search/cache";
import { suggestions } from "@/server/search/suggest";
import { recordSearch, trendingSearches } from "@/server/search/trending";
import { insertBook, insertCategory, insertEdition } from "../support/catalogue";
import { adminConnection } from "../support/db";

let db: Connection;
const recorded: string[] = [];

const letters = (n: number) =>
  Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join(
    "",
  );

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  // the tests share Redis with the running app; leave no trending entries behind
  if (recorded.length > 0) await redis().zrem(trendingKey(new Date()), ...recorded);
  await redis().del("search:trending:top");
  await db.end();
});

describe("cached", () => {
  it("computes once and serves the stored value after that", async () => {
    const key = `search:test:${letters(10)}`;
    let calls = 0;
    const compute = async () => {
      calls += 1;
      return { value: 42 };
    };
    expect(await cached(key, 30, compute)).toEqual({ value: 42 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await cached(key, 30, compute)).toEqual({ value: 42 });
    expect(calls).toBe(1);
    await redis().del(key);
  });

  it("computes every time without a key", async () => {
    let calls = 0;
    await cached(null, 30, async () => ++calls);
    await cached(null, 30, async () => ++calls);
    expect(calls).toBe(2);
  });
});

describe("trending", () => {
  it("counts searches that found something, most searched first", async () => {
    const popular = `zz${letters(8)}`;
    const rare = `zz${letters(8)}`;
    recorded.push(popular, rare);
    await recordSearch(popular, 3);
    await recordSearch(popular.toUpperCase(), 1);
    await recordSearch(rare, 2);
    await recordSearch(`zz${letters(8)}`, 0);
    await redis().del("search:trending:top");

    const top = await trendingSearches(50);
    const mine = top.filter((t) => t.query === popular || t.query === rare);
    expect(mine).toEqual([
      { query: popular, count: 2 },
      { query: rare, count: 1 },
    ]);
  });
});

describe("suggestions", () => {
  it("offers aliases, courses and books that start with what was typed", async () => {
    const word = `q${letters(6)}`;
    await db.query("INSERT INTO search_aliases (alias, expansion) VALUES (?, ?)", [
      word,
      `${word} expanded meaning`,
    ]);
    await redis().del("search:aliases:v1");
    const book = await insertBook(db, await insertCategory(db), `${word} for engineers`);
    await insertEdition(db, book);

    const found = await suggestions(word);
    expect(found).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "alias", text: `${word} expanded meaning` }),
        expect.objectContaining({ kind: "book", href: `/catalog/${book}` }),
      ]),
    );
  });

  it("waits for two characters", async () => {
    expect(await suggestions("q")).toEqual([]);
  });
});
