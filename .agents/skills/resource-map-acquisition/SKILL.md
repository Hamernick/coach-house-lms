---
name: resource-map-acquisition
description: Resume bounded, evidence-backed public resource acquisition from the private IRS EO queue without reviewing or publishing records.
---

# Resource Map Acquisition

Use this skill when asked to resume, research, or populate the public resource
map from the local IRS EO discovery pool.

## Required boundaries

- Read `AGENTS.md` and `docs/agent/resource-map-enrichment.md` first.
- Treat IRS rows as identity discovery only. A filing address is not a service
  location and an NTEE code is not proof of a service.
- Prefer official provider pages and current government, 211, food-bank, or
  other authoritative service directories.
- Keep raw search and directory URLs private. Provider-facing websites may be
  proposed only when identity is supported.
- Never invent websites, social accounts, services, hours, eligibility,
  coordinates, service areas, or images.
- Do not import to Supabase, review, approve, promote, publish, deploy, or alter
  production. Those require separate user authorization.

## Resume a bounded run

Before estimating full-corpus throughput, build or refresh the private benchmark:

```bash
pnpm resource-map:eo-plan-benchmark -- --input <eo1.csv,eo2.csv,...> --sample 10000
pnpm resource-map:eo-plan-benchmark -- --input <eo1.csv,eo2.csv,...> --sample 10000 --write
```

The first command is read-only. The second writes only an ignored, private,
stratified cohort, its append-only identity events, and a signed manifest under
`.engine/eo/benchmark/`. It must scan the complete deduplicated corpus, exclude
already researched EINs, retain population projection weights, and report zero
network, AI, database, review, and publication activity. Re-run it with the same
inputs and verify that both output hashes are unchanged before starting workers.

Create immutable 25-record discovery packages after the benchmark is signed:

```bash
pnpm resource-map:eo-plan-work -- --package-size 25
pnpm resource-map:eo-plan-work -- --package-size 25 --write
pnpm resource-map:eo-work-lease -- --action status --plan <plan-directory>
```

In a continuation chat, claim exactly one package with a unique worker ID:

```bash
pnpm resource-map:eo-work-lease -- --action claim --plan <plan-directory> --worker <worker-id> --write
```

Send heartbeats before the lease expires. Complete only after hashing the bounded
result file; otherwise record a retryable or terminal failure. Never edit a
package, manifest, lease, heartbeat, completion, or failure receipt by hand.
Expired leases are archived, retryable failures retain their attempts, and the
third failure or a non-retryable contract error enters dead-letter review.

After claiming, generate the signed search plan before calling any adapter:

```bash
pnpm resource-map:eo-plan-search -- --package <package.json>
pnpm resource-map:eo-plan-search -- --package <package.json> --write
```

The waterfall is local evidence cache, authoritative directory indexes,
replaceable search API, then sandboxed browser. Common Crawl is a known-URL
archive lookup, not an organization-name search engine. Adapter output must use
the normalized result contract; search snippets are discovery hints only. When
results are supplied, the planner deduplicates exact URLs across EINs, enforces
per-host and total budgets, creates robots checks, and emits identifier-safe
stage telemetry before any provider fetch is allowed.

Run reusable offline adapters before owned crawling or rendered search:

```bash
pnpm resource-map:eo-run-search-adapter -- --plan <search-plan.json> --adapter local_evidence_cache --input <candidate-sets.jsonl>
pnpm resource-map:eo-run-search-adapter -- --plan <search-plan.json> --adapter authoritative_directory_index --input <directory-records.jsonl>
```

Both are dry-run-first. Directory rows require a supported authoritative source
kind, provider URL, human-facing source URL, and either exact EIN or exact
normalized provider name plus state. Never add fuzzy name-only matching.

Plan owned discovery only after the offline tiers:

```bash
pnpm resource-map:eo-plan-owned-discovery -- --plan <search-plan.json> --evidence-documents <evidence.jsonl> --directory-records <directory-records.jsonl>
```

This planner must remain network-free, paid-provider-free, and dry-run-first.
Never treat a deterministic domain hypothesis as evidence. Any future crawler
must obey the signed total and exact-host budgets, evaluate robots first, retain
source provenance, and feed the existing provider verification gate.

1. Inspect `data/resource-map/.engine/eo/latest-report.json` and
   `checkpoint.json`. If the private candidate pool is absent, ask for the EO
   file paths and run `pnpm resource-map:eo-import -- --input <files> --write`.
2. Run `pnpm resource-map:eo-run -- --resume --batch 25 --write`. Use a smaller
   batch when the user gives a tighter time limit.
3. Research only the generated `current-work-items.jsonl` batch. Search official
   provider identity first, then service, location, access, and contact pages.
4. Save bounded search candidates by EIN, then run
   `pnpm resource-map:eo-resolve-websites -- --candidates <file> --network true --write`.
   Apply its result file through `resource-map:eo-run -- --resume --results
<file> --write`. Never guess a domain; directory and social URLs cannot become
   primary provider websites.
5. Use deterministic page extraction before model assistance. Use a model only
   for evidence-backed ambiguity, classification, or concise summaries. Fetch
   at most three retained same-site pages per record with
   `pnpm resource-map:eo-collect-service-evidence -- --ein <ein> --max-records
1 --max-pages 3 --network true --write`, then repeat without `--network` to
   verify cache reuse. The collector stores source snippets for service, access,
   eligibility, hours, and service-area candidates; it does not promote them to
   public fields.
6. Treat provider-linked socials, contacts, service-page links, field evidence,
   and images as private evidence. Do not convert linked pages into service
   claims or images into public assets without separate evidence and rights
   checks.
7. Build bounded private field candidates with
   `pnpm resource-map:eo-build-private-drafts -- --max-records 25 --write`.
   This may group retained source snippets but must leave service locations and
   coordinates empty until provider evidence supports them. It never uses an IRS
   filing address as a service location and never creates review-ready or public
   records.
8. Record bounded results in an ignored JSONL file. Each row needs `ein`,
   `acquisitionStatus`, `websiteUrl`, and `evidenceUrls`. Use `held` with concise
   reason codes when identity or service evidence is unavailable or conflicts.
9. Apply the checkpoint with
   `pnpm resource-map:eo-run -- --resume --results <results.jsonl> --batch 25 --write`.
10. Report exact eligible, queued, completed, held, AI-call, network-request,
    reviewed, and published counts. The last two must remain zero in this flow.

## Statuses

- `website_matched`: provider identity is sufficiently supported.
- `evidence_fetched`: provider service evidence has been retained.
- `deterministically_complete`: required fields were extracted without a model.
- `needs_ai`: retained evidence is ambiguous enough to justify model assistance.
- `verified`: an independent evidence comparison succeeded.
- `held`: evidence is missing, weak, dead, unrelated, or contradictory.
- `ready_for_review`: evidence requirements pass; human review is still needed.

Never skip directly from IRS identity data to `verified` or `ready_for_review`.

Research workers must append validated state transitions instead of overwriting
history. Every event requires an EIN, allowed prior and next state, policy
version, input hash, evidence hash, observation time, idempotency key, and event
hash. Replaying the event stream must reconstruct the same current state and
reject altered, skipped, or out-of-order transitions.
