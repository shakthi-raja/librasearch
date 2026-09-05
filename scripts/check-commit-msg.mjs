#!/usr/bin/env node
// Commit message gate, run by lefthook on commit-msg.
// Grammar: type(scope): subject, lowercase, imperative, no trailing period.

import { readFileSync } from "node:fs";

const TYPES = [
  "feat",
  "fix",
  "test",
  "refactor",
  "perf",
  "sec",
  "style",
  "docs",
  "build",
  "ci",
  "chore",
];
const SUBJECT = new RegExp(`^(${TYPES.join("|")})(\\([a-z0-9-]+\\))?: [a-z0-9].*[^.\\s]$`);
const MAX_SUBJECT = 72;
const MAX_BODY = 72;

export function checkCommitMessage(raw) {
  const lines = raw
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .join("\n")
    .trimEnd()
    .split("\n");
  const subject = lines[0] ?? "";
  const errors = [];

  if (/^Merge (branch|remote-tracking branch) /.test(subject)) return errors;

  if (!SUBJECT.test(subject)) {
    errors.push(`subject must match "type(scope): subject" with one of: ${TYPES.join(", ")}`);
  }
  if (subject.length > MAX_SUBJECT)
    errors.push(`subject is ${subject.length} characters, max ${MAX_SUBJECT}`);
  if (/\[[A-Z]+[-_][A-Z0-9-]+\]/.test(subject))
    errors.push("requirement ids do not belong in the subject");
  if (lines.length > 1 && lines[1] !== "") errors.push("leave a blank line after the subject");

  lines.slice(2).forEach((line, i) => {
    if (line.length > MAX_BODY && !/^\S+:\/\/\S+$/.test(line)) {
      errors.push(`body line ${i + 3} is longer than ${MAX_BODY} characters`);
    }
  });

  if (/^co-authored-by:/im.test(raw)) errors.push("co-authored-by trailers are not used");
  if (/generated (with|by)/i.test(raw)) errors.push("tool attribution is not used");
  if (/[\u2013\u2014]/.test(raw)) errors.push("use a plain hyphen instead of en or em dashes");
  if (/\p{Extended_Pictographic}/u.test(raw)) errors.push("emoji are not used in commit messages");

  return errors;
}

const file = process.argv[2];
if (file) {
  const errors = checkCommitMessage(readFileSync(file, "utf8"));
  if (errors.length > 0) {
    process.stderr.write(`commit message rejected:\n${errors.map((e) => `  - ${e}`).join("\n")}\n`);
    process.exit(1);
  }
}
