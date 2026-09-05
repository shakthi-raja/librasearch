import { describe, expect, it } from "vitest";
import { checkCommitMessage } from "../../../scripts/check-commit-msg.mjs";

describe("commit message gate", () => {
  it.each([
    "feat(auth): add sign-in, sign-out and session lookup",
    "ci: add check, database and audit workflows",
    "fix(holds): release the copy when a ready hold expires",
    "Merge branch 'dev/kishan'",
  ])("accepts %s", (message) => {
    expect(checkCommitMessage(message)).toEqual([]);
  });

  it.each([
    ["Add sign-in", /type\(scope\)/],
    ["feat(auth): Add sign-in", /type\(scope\)/],
    ["feat(auth): add sign-in.", /type\(scope\)/],
    ["feat(auth): add sign-in [LS-F-001]", /requirement ids/],
    ["feat(auth): add sign-in\nbody without a gap", /blank line/],
    ["feat(auth): add sign-in\n\nCo-Authored-By: someone <a@b.c>", /co-authored-by/],
    ["feat(ui): add shell \u2014 tokens", /hyphen/],
    ["feat(ui): add shell \u{1F680}", /emoji/],
    [`feat(ui): ${"a".repeat(70)}`, /max 72/],
  ])("rejects %s", (message, reason) => {
    expect(checkCommitMessage(message).join("\n")).toMatch(reason);
  });

  it("ignores comment lines git adds to the template", () => {
    expect(checkCommitMessage("docs(readme): add setup\n# Please enter the message")).toEqual([]);
  });
});
