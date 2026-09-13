import "server-only";
import type { CourseInput, OfferingInput, TermInput } from "@/lib/validation/academic";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import {
  academicStructure,
  clearCurrentTerm,
  insertCourse,
  insertOffering,
  insertTerm,
  markCurrentTerm,
} from "@/server/repositories/academic";

export function getAcademicStructure() {
  return academicStructure(pool("librarian"));
}

export async function createTerm(input: TermInput) {
  await withTransaction(pool("librarian"), async (connection) => {
    if (input.current) await clearCurrentTerm(connection);
    await insertTerm(connection, input);
  });
}

export async function makeCurrentTerm(termId: number) {
  await withTransaction(pool("librarian"), async (connection) => {
    await clearCurrentTerm(connection);
    await markCurrentTerm(connection, termId);
  });
}

export function createCourse(input: CourseInput) {
  return insertCourse(pool("librarian"), input);
}

export function createOffering(input: OfferingInput) {
  return insertOffering(pool("librarian"), input);
}
