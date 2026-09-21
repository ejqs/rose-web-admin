# Jev questions (admin)

**Updated:** 2026-09-21

Operators edit the **opinionated Jev taxonomy** as rows in shared Postgres (`jev_questions`). rose-bot loads **enabled** questions on the next scrape of new articles. No bot deploy is required to add a Choice, Score, or Noul.

The table is created by rose-bot on boot. This admin app also runs `CREATE TABLE IF NOT EXISTS jev_questions` so `/questions` works before that deploy. Seeds (globe country+sentiment, hop-in, article metadata) are inserted by rose-bot only when a `question_id` is missing.

## Add a question

1. Sign in. Open **Questions** (`/questions`).
2. Fill **Add question**:
   - `question_id` — `[a-z][a-z0-9_]{0,63}`. Code key; not sent to the model.
   - `type` — `choice`, `score`, or `noul`.
   - `instructions` — the full question (plain text or JSON object).
   - `criteria` — JSON. Choice: `{"option":"rubric"}` (1–255 keys). Score: `["level0","level1"]` (2–10). Noul: optional `{"true":"...","false":"..."}`.
   - Leave `depends_on` and `criteria_source` empty unless this is a follow-up (globe `primary_country` uses `region` / `countries_in_region`).
3. Save. **Disable** to stop sending it.

Do not rename `about_primary_country`, `region`, `country_sentiment`, or `primary_country` if the public globe should keep working.

## Next scrape

New articles (no `article_geo_sentiment` row yet) get every enabled question. Already-analyzed articles are not re-asked. Details live in rose-bot [`docs/jev-questions.md`](https://github.com/ejqs/newsey/blob/main/docs/jev-questions.md).
