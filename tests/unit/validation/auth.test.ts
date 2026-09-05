import { describe, expect, it } from "vitest";
import { password, signInSchema } from "@/lib/validation/auth";

describe("sign-in input", () => {
  it("lowercases emails and uppercases university ids", () => {
    expect(
      signInSchema.parse({ identifier: " Student@LibraSearch.local ", password: "x" }),
    ).toEqual({
      identifier: "student@librasearch.local",
      password: "x",
    });
    expect(signInSchema.parse({ identifier: "pes1ug24cs001", password: "x" }).identifier).toBe(
      "PES1UG24CS001",
    );
  });

  it("requires both fields", () => {
    expect(signInSchema.safeParse({ identifier: "", password: "" }).success).toBe(false);
  });
});

describe("new password policy", () => {
  it.each([
    ["short1", false],
    ["onlyletterslong", false],
    ["1234567890", false],
    ["shelf mark 42", true],
  ])("%s is accepted: %s", (value, ok) => {
    expect(password.safeParse(value).success).toBe(ok);
  });
});
