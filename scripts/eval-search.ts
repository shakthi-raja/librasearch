import { readFile } from "node:fs/promises";

/** Expected chapters are "isbn13#chapter", stable across reseeds. */
type Case = { query: string; expected: string[] };
type Result = { hits: { isbn13: string; chapterNo: number }[] };

const base = process.env.EVAL_BASE_URL ?? "http://localhost:3000";
const cases = JSON.parse(await readFile("db/eval/queries.json", "utf8")) as Case[];

let recall = 0;
let mrr = 0;
let failures = 0;

for (const testCase of cases) {
  const url = `${base}/api/v1/search?mode=hybrid&q=${encodeURIComponent(testCase.query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    failures += 1;
    process.stdout.write(`${testCase.query}: HTTP ${response.status}\n`);
    continue;
  }
  const data = (await response.json()) as Result;
  const ids = data.hits.map((hit) => `${hit.isbn13}#${hit.chapterNo}`);
  const found = testCase.expected.filter((id) => ids.includes(id));
  const caseRecall = found.length / testCase.expected.length;
  const rank = ids.findIndex((id) => testCase.expected.includes(id));
  recall += caseRecall;
  mrr += rank >= 0 ? 1 / (rank + 1) : 0;
  process.stdout.write(
    `${testCase.query}: recall ${caseRecall.toFixed(2)}, first hit ${
      rank >= 0 ? rank + 1 : "none"
    }\n`,
  );
}

process.stdout.write(
  `\nRecall@10 ${(recall / cases.length).toFixed(3)} / MRR@10 ${(mrr / cases.length).toFixed(
    3,
  )} / ${cases.length - failures} of ${cases.length} queries answered\n`,
);
if (failures > 0) process.exitCode = 1;
