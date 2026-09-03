/**
 * The library floor as a surveyor would draw it. Rack codes here are the same
 * codes copies carry in `copies.rack`, so search results and reading lists can
 * pin a book to the stack it sits on.
 */

export type Rack = { code: string; x: number; y: number; w: number; h: number };
export type Bay = { id: string; label: string; racks: Rack[]; reserve?: boolean };

const row = (prefix: string, count: number, x: number, y: number, w: number, gap: number): Rack[] =>
  Array.from({ length: count }, (_, i) => ({
    code: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    x,
    y: y + i * gap,
    w,
    h: 14,
  }));

export const FLOOR = { width: 960, height: 640, wall: { x: 40, y: 40, w: 880, h: 560 } } as const;

export const ENTRANCE = { x: 470, width: 70 } as const;

export const BAYS: Bay[] = [
  { id: "cs", label: "Computer science", racks: row("CS", 6, 92, 112, 210, 38) },
  { id: "ec", label: "Electronics", racks: row("EC", 4, 372, 112, 176, 38) },
  { id: "ma", label: "Mathematics", racks: row("MA", 4, 640, 112, 220, 38) },
  { id: "me", label: "Mechanical", racks: row("ME", 3, 92, 432, 210, 38) },
  { id: "mg", label: "Management", racks: row("MG", 3, 740, 432, 120, 38) },
  { id: "res", label: "Course reserve", racks: row("RES", 2, 384, 300, 152, 30), reserve: true },
];

export const READING_ROOM = { x: 384, y: 400, w: 300, h: 140 } as const;

export const DESK = { x: 556, y: 556, w: 120, h: 26 } as const;

export function rackCentre(code: string): { x: number; y: number } | undefined {
  for (const bay of BAYS) {
    const rack = bay.racks.find((r) => r.code === code);
    if (rack) return { x: rack.x + rack.w, y: rack.y + rack.h / 2 };
  }
  return undefined;
}
