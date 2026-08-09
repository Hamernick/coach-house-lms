# Source-Verified Resource Enrichment Design

## Build brief

Build a source-verified public-resource enrichment and publishing pipeline in
Next.js App Router, Node.js, the OpenAI Responses API, and Supabase/Postgres. It
should include repeated source comparison, deterministic quality audits,
structured AI summaries, explicit services and access instructions, human review,
and safe promotion, with dry-run-first behavior and auditable evidence. Make it
feel trustworthy and clear, using specific resource titles, plain-language copy,
source timestamps, field-level provenance, and visible unknowns. Output as
repository scripts, tests, migrations only when required, curated JSONL, and
verified local/live `/find` data.

## Current evidence

- Live `/api/public/resource-map/items` returns 64 external resources. The public
  UI combines these with 13 platform organizations for 77 entries.
- The 64 external records are Chicago Public Library branches with bare branch or
  neighborhood names and null descriptions.
- Local preview returns 4,124 records from 4,249 candidates. Of those candidates,
  3,629 lack descriptions, 4,249 lack eligibility and access instructions, 3,333
  lack provider websites, and 2,445 already require review.
- The local set is nationwide and heavily weighted toward seasonal cooling data;
  it is not a publish-ready expansion of the Chicago library batch.

## Pipeline

1. **Audit:** score every candidate for title clarity, provider/source quality,
   description, services, eligibility, access, contact, hours, location, freshness,
   and evidence coverage. Never treat generated fallback copy as verified data.
2. **Collect evidence:** fetch the authoritative provider page when available,
   retain source content hashes and timestamps, and preserve API/raw-record
   evidence. Cache by URL and never overwrite raw ingestion records.
3. **Draft enrichment:** use Responses API Structured Outputs to produce a specific
   display title, source-grounded summary, service details, eligibility, access
   steps, intake URL, documents, accessibility, languages, and explicit unknowns.
4. **Verify enrichment:** run a separate model pass against the same evidence, then
   apply deterministic checks. Unsupported or contradicted claims return to review.
5. **Human approval:** an administrator reviews source, draft, verification issues,
   and field evidence. AI output never publishes automatically.
6. **Promote:** only verified, approved records meeting the publication contract can
   reach canonical published tables. Use existing batched inserts/upserts, private
   staging RLS, and sanitized public view/RPC boundaries.

## Publication contract

A public record requires a specific title, a plain-language summary, named
services, clear access instructions, a valid actionable contact or link, location
or service area, source URLs, two completed enrichment passes, no unsupported
claims, and final administrator approval. Unknown eligibility, cost, documents, or
hours must be stated as unknown rather than guessed.

The first rollout is Chicago-first but the contract and tooling remain nationwide.
The existing 4,124-record local preview is an intake queue, not a release batch.

## Implemented on 2026-07-14

- Added a deterministic readiness audit and hard publication gate. Current result:
  `0/4,249` candidates are publishable.
- Added provider-page collection with redirect revalidation, private-network
  blocking, response-size limits, content hashes, fetch timestamps, and
  title/address/phone/email comparisons.
- Fetched all 81 Chicago Public Library provider pages. All loaded; 321 source
  fields matched after normalizing address abbreviations. Two genuine conflicts
  remain blocked: a `Washtington` title typo and Rogers Park carrying Scottsdale's
  email address.
- Added Responses API Structured Output schemas for separate draft and independent
  verification passes, application-level citation validation, prompt/model
  versioning, and AI-derived field evidence. The runner is dry-run-first.
- Added an admin-only, RLS-protected enrichment pass ledger migration with
  idempotency and queue indexes.
- Corrected ambiguous library hours so `Noon-8` becomes `12:00-20:00` and `1-5`
  becomes `13:00-17:00`, including reprocessing already structured stale hours.
- Stopped promotion from manufacturing `last_verified_at`; actual verification
  time and human approver now propagate into canonical payloads.
- Added a sanitized paginated public RPC and a 5,000-record server fetch ceiling,
  replacing the previous 500-record truncation point.
- Produced a separate, ignored 4,249-record reprocessed JSONL and verified all 81
  library records are ready for the AI draft/verification stage.

## Remaining release gates

- Configure `OPENAI_API_KEY` and run the five-record draft/verification pilot.
- Review those five records manually, then process the remaining Chicago library
  branches in bounded batches.
- Apply the enrichment ledger migration, add transactional canonical promotion,
  and expose the admin review evidence.
- Set and verify the production resource-map database flag before any deployment.
- Do not publish until the selected enriched batch passes strict readiness with no
  blocking gaps.
