import { describe, expect, it } from "vitest";
import { paletteItems } from "@/lib/nav/palette";

describe("paletteItems", () => {
  it("lists the role's pages and a catalogue search", () => {
    const items = paletteItems("STUDENT", "");
    const hrefs = items.map((item) => item.href);
    expect(hrefs).toContain("/student");
    expect(hrefs).toContain("/notices");
    expect(hrefs).toContain("/search");
    expect(hrefs.every((href) => !href.startsWith("/admin"))).toBe(true);
  });

  it("gives the librarian the operational pages", () => {
    const labels = paletteItems("LIBRARIAN", "").map((item) => item.label);
    expect(labels).toContain("Demand");
    expect(labels).toContain("Exams");
    expect(labels).toContain("Analytics");
  });

  it("filters by label and hint, case-insensitively", () => {
    const items = paletteItems("LIBRARIAN", "DEM");
    expect(items.some((item) => item.label === "Demand")).toBe(true);
    expect(items.length).toBeLessThanOrEqual(9);
  });

  it("ends with a catalogue search for a free-text query", () => {
    const last = paletteItems("STUDENT", "quantum computing").at(-1);
    expect(last).toMatchObject({
      label: "Search the catalogue for “quantum computing”",
      href: "/search?q=quantum%20computing",
    });
  });
});
