import { asc } from "drizzle-orm";
import { getDb, ensureAuthTables } from "@/lib/db";
import { jevQuestions } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { prettyJson } from "@/lib/jev-questions";
import { createQuestion, setQuestionEnabled, updateQuestion } from "./actions";

export const dynamic = "force-dynamic";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

function QuestionFields({
  row,
}: {
  row?: {
    questionId: string;
    type: string;
    instructions: string;
    criteria: string | null;
    criteriaSource: string | null;
    dependsOn: string | null;
    enabled: number;
    sortOrder: number;
    notes: string | null;
  };
}) {
  const enabled = row ? row.enabled !== 0 : true;
  return (
    <>
      <div className="grid gap-1">
        <Label>question_id</Label>
        <Input name="question_id" defaultValue={row?.questionId ?? ""} required pattern="[a-z][a-z0-9_]{0,63}" />
      </div>
      <div className="grid gap-1">
        <Label>type</Label>
        <select name="type" defaultValue={row?.type ?? "noul"} className={selectClass}>
          <option value="choice">choice</option>
          <option value="score">score</option>
          <option value="noul">noul</option>
        </select>
      </div>
      <div className="grid gap-1 md:col-span-2">
        <Label>instructions</Label>
        <Textarea name="instructions" rows={4} defaultValue={prettyJson(row?.instructions) || row?.instructions || ""} required />
      </div>
      <div className="grid gap-1 md:col-span-2">
        <Label>criteria (JSON)</Label>
        <Textarea name="criteria" rows={6} defaultValue={prettyJson(row?.criteria)} placeholder='{"option":"rubric"} or ["level0","level1"]' />
      </div>
      <div className="grid gap-1">
        <Label>sort_order</Label>
        <Input name="sort_order" type="number" defaultValue={row?.sortOrder ?? 100} />
      </div>
      <div className="grid gap-1">
        <Label>depends_on</Label>
        <Input name="depends_on" defaultValue={row?.dependsOn ?? ""} placeholder="region" />
      </div>
      <div className="grid gap-1">
        <Label>criteria_source</Label>
        <Input name="criteria_source" defaultValue={row?.criteriaSource ?? ""} placeholder="countries_in_region" />
      </div>
      <div className="grid gap-1">
        <Label>notes</Label>
        <Input name="notes" defaultValue={row?.notes ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" value="1" defaultChecked={enabled} />
        enabled
      </label>
    </>
  );
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await ensureAuthTables();
  const error = searchParams ? (await searchParams).error : undefined;
  const rows = await getDb().select().from(jevQuestions).orderBy(asc(jevQuestions.sortOrder), asc(jevQuestions.id));

  return (
    <FadeIn>
      <main className="grid gap-8">
        <div>
          <h1 className="text-xl font-semibold">Jev questions</h1>
          <p className="text-sm text-muted-foreground">
            Taxonomy is data. Add or edit Choice / Score / Noul rows. Enabled questions are sent on the next
            scrape of new articles. Country + sentiment IDs stay seeded; do not rename them if you still want
            the globe.
          </p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <form action={createQuestion} className="grid max-w-3xl gap-3 rounded-lg border p-4 md:grid-cols-2">
          <h2 className="font-medium md:col-span-2">Add question</h2>
          <QuestionFields />
          <div className="md:col-span-2">
            <Button type="submit">Add question</Button>
          </div>
        </form>

        <ul className="grid gap-4">
          {rows.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No rows yet. Deploy rose-bot so globe seeds insert, or add a question here.
            </li>
          ) : (
            rows.map((row) => (
              <li key={row.id} className="grid gap-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>
                    <code>{row.questionId}</code>
                  </strong>
                  <Badge variant="outline">{row.type}</Badge>
                  <Badge variant={row.enabled ? "default" : "secondary"}>{row.enabled ? "enabled" : "disabled"}</Badge>
                </div>
                <form action={updateQuestion} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="id" value={row.id} />
                  <QuestionFields
                    row={{
                      questionId: row.questionId,
                      type: row.type,
                      instructions: row.instructions,
                      criteria: row.criteria,
                      criteriaSource: row.criteriaSource,
                      dependsOn: row.dependsOn,
                      enabled: row.enabled,
                      sortOrder: row.sortOrder,
                      notes: row.notes,
                    }}
                  />
                  <div>
                    <Button type="submit" variant="outline">
                      Save
                    </Button>
                  </div>
                </form>
                <form action={setQuestionEnabled}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="enabled" value={row.enabled ? "0" : "1"} />
                  <Button type="submit" variant="outline" size="sm">
                    {row.enabled ? "Disable" : "Enable"}
                  </Button>
                </form>
              </li>
            ))
          )}
        </ul>
      </main>
    </FadeIn>
  );
}
