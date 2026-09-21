"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, ensureAuthTables } from "@/lib/db";
import { jevQuestions } from "@/lib/schema";
import { requireSession } from "@/lib/session";
import { readQuestionForm } from "@/lib/jev-questions";

function fail(message: string): never {
  redirect(`/questions?error=${encodeURIComponent(message)}`);
}

export async function createQuestion(formData: FormData) {
  await requireSession();
  await ensureAuthTables();
  const parsed = readQuestionForm(formData);
  if (!parsed.ok) fail(parsed.error);
  const t = new Date().toISOString();
  try {
    await getDb().insert(jevQuestions).values({
      questionId: parsed.value.questionId,
      type: parsed.value.type,
      instructions: parsed.value.instructions,
      criteria: parsed.value.criteria,
      criteriaSource: parsed.value.criteriaSource,
      dependsOn: parsed.value.dependsOn,
      enabled: parsed.value.enabled,
      sortOrder: parsed.value.sortOrder,
      notes: parsed.value.notes,
      createdAt: t,
      updatedAt: t,
    });
  } catch {
    fail("Could not create question (duplicate question_id?).");
  }
  revalidatePath("/questions");
  redirect("/questions");
}

export async function updateQuestion(formData: FormData) {
  await requireSession();
  await ensureAuthTables();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) fail("Missing question id.");
  const parsed = readQuestionForm(formData);
  if (!parsed.ok) fail(parsed.error);
  const t = new Date().toISOString();
  try {
    await getDb()
      .update(jevQuestions)
      .set({
        questionId: parsed.value.questionId,
        type: parsed.value.type,
        instructions: parsed.value.instructions,
        criteria: parsed.value.criteria,
        criteriaSource: parsed.value.criteriaSource,
        dependsOn: parsed.value.dependsOn,
        enabled: parsed.value.enabled,
        sortOrder: parsed.value.sortOrder,
        notes: parsed.value.notes,
        updatedAt: t,
      })
      .where(eq(jevQuestions.id, id));
  } catch {
    fail("Could not save question (duplicate question_id?).");
  }
  revalidatePath("/questions");
  redirect("/questions");
}

export async function setQuestionEnabled(formData: FormData) {
  await requireSession();
  await ensureAuthTables();
  const id = Number(formData.get("id"));
  const enabled = String(formData.get("enabled")) === "1" ? 1 : 0;
  if (!Number.isInteger(id)) return;
  const t = new Date().toISOString();
  await getDb()
    .update(jevQuestions)
    .set({ enabled, updatedAt: t })
    .where(eq(jevQuestions.id, id));
  revalidatePath("/questions");
}
