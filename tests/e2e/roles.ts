export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Libra@2026";

export const ROLES = {
  student: { identifier: "student@librasearch.local", home: "/student" },
  faculty: { identifier: "faculty@librasearch.local", home: "/faculty" },
  librarian: { identifier: "librarian@librasearch.local", home: "/admin" },
} as const;

export type Role = keyof typeof ROLES;

export const storageFor = (role: Role) => `tests/e2e/.auth/${role}.json`;
