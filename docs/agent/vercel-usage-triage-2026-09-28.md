# Vercel Hobby usage triage — 2026-09-28

## Live baseline

Read the authenticated Vercel dashboard around 00:43–00:50 EDT. Team:
`calebs-projects-58ab1538`. Usage window: August 29–September 28 (Last 30 Days).

| Metric | Dashboard usage | Attribution |
| --- | --- | --- |
| Fluid Active CPU | 3h 7m / 4h (78%) | Essentially all Coachhouse; old Stripe hotfix project 4s |
| Functions Storage | 8.01 GB / 10 GB (80%) | Coachhouse; other listed projects 0 B |
| Deployment Storage | 5.1 GB / 10 GB | Not investigated further |
| Fast Data Transfer | 1.52 GB / 100 GB | Not the constrained resource |
| Function invocations | About 65K / 1M | Team total |

Sources: [team usage](https://vercel.com/calebs-projects-58ab1538/~/usage),
[function storage](https://vercel.com/calebs-projects-58ab1538/~/usage/deployments-functions?period=daily),
[Coachhouse functions](https://vercel.com/calebs-projects-58ab1538/coachhouse/observability/vercel-functions?environment=all).

Hobby's available 12-hour function view identified `/` (resource map) as the
largest recent CPU consumer: 160 invocations, approximately 3 CPU-minutes.
The root detail's Production filter showed 152 invocations, P75 active CPU
1.24s and 14.5% cold starts. Views refreshed at slightly different times.
The external API table showed 160 Data Cache hits and only 2 Supabase calls.
The Duration panel explicitly displayed Demo Data; its values were not used.
This short window does not establish the entire month's route distribution.

## One local CPU fix

The category scan re-normalized each organization's full narrative for every
alias. There are 188 category definitions and 252 aliases. The map constructs
organization items for filtering, guides and saved-item state during rendering.

Prepare one matcher per text corpus and reuse it across the category scan.
Apply the same change to free-text category input resolution. Preserve word
boundaries, punctuation, apostrophe and ampersand normalization. No global cache
retains organization text; no rendering, permissions or data-visibility changes.

Files: `src/lib/public-map/resource-category-alias-matching.ts`,
`resource-map-items.ts`, `resource-categories.ts` and the existing
`tests/acceptance/public-map-resource-map-items.test.ts`.

### Validation

- 69 tests passed across resource-map items, map search quality, public Find
  route and public Find performance contracts.
- Scoped ESLint and `git diff --check` passed.
- Benchmark used the original helper from HEAD `0cdf5b15` versus the new matcher,
  real category definitions, synthetic narratives, 100 classifications per
  sample and median process CPU time across seven samples after warmup.
- Every alias returned the same result before/after for each benchmark corpus.

| Narrative characters | Before CPU ms / 100 scans | After CPU ms / 100 scans | Reduction |
| --- | --- | --- | --- |
| 1,000 | 630.034 | 32.543 | 94.8% |
| 4,000 | 2,031.426 | 59.356 | 97.1% |
| 16,000 | 9,059.569 | 199.881 | 97.8% |

These are classification microbenchmarks, not measured whole-request or
production quota savings. Local benchmark: `/tmp/vercel-category-cpu-benchmark.cjs`;
results: `/tmp/vercel-category-cpu-benchmark.log`.

## Storage action awaiting approval

Coachhouse currently retains Canceled, Errored, Pre-Production and Production
deployments for 30 days. The preview menu offers 30 days, 2 weeks, 1 week and 1 day.
Proposed single change: Pre-Production to 1 week; all other durations unchanged.
This expires eligible old preview URLs and reduces retained history; protected
deployment exceptions still apply. No individual deployments were deleted.

[Retention settings](https://vercel.com/calebs-projects-58ab1538/coachhouse/settings/build-and-deployment#deployment-retention-policy).

Inspected preview `9zzn3tg8kBJsLQQBzcjZKwMCbJkX`: 223 function routes,
many displayed as 30.5 MB in IAD1; middleware 804 kB. Shared bundles must not be
multiplied by route count to estimate billable storage. Bundle contents were not
profiled and no speculative dependency exclusions were made.

## Release scope

The CPU change ships independently on `fix/vercel-cpu-classification-20260928`.
The earlier bandwidth patch remains preserved in its original worktree and is
excluded from this release. No database migration or provider setup is required
for the CPU fix. Required hosted quality and code-owner review precede merge.
Compare production root Active CPU and invocation counts over equivalent traffic
windows after deployment. Previously consumed CPU is not recovered by an
optimization. Storage reduction is not yet measured.
