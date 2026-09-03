# Owned Resource Crawler Executor

Date: 2026-09-02
Status: approved through delegated implementation authority

## Objective

Turn signed, deterministic provider fetch plans into a private evidence corpus without paid search, AI calls, database writes, review decisions, or publication.

## Decision

Keep planning and network execution separate. The planner produces an immutable, signed contract. The executor validates that contract, enforces its limits, and emits resumable, tamper-evident receipts and normalized evidence. It never promotes a resource.

Alternatives rejected:

- Adding network behavior to the planner would mix deterministic planning with external mutation.
- Reusing the general website resolver would bypass package-level signatures, robots accounting, and retained-byte budgets.

## Execution contract

- Default: validate and report only; zero network requests and zero writes.
- Live mode: require the signed parent search plan, `--network true`, `--write`, and `--confirm-plan <exact hash>`.
- Validate the fetch-plan signature before work begins.
- Bind the fetch plan to its parent search-plan hash, package ID, request budget, retained-byte budget, and acquisition policy.
- Reject unsigned, modified, unsupported, or over-budget plans.
- Keep every output private with `publicDisplayEligible: false` and `publicationBlocked: true`.

## Network safety

- Allow only HTTP and HTTPS on standard ports, with no embedded credentials.
- Reject localhost, local suffixes, IP literals in reserved/private ranges, and DNS answers resolving to non-public addresses.
- Validate DNS on the socket lookup path to reduce rebinding risk.
- Follow redirects manually, revalidating every target; stop after three hops.
- Fetch and evaluate robots.txt before each origin. Deny on 401/403, 5xx, network failure, or an explicit disallow.
- Process serially with per-host delay, request timeout, response-type allowlist, per-response byte limits, and a signed package byte ceiling.
- Count robots checks and redirects against the signed network budget.

## Private artifacts

For each terminal request, write an atomic mode-0600 receipt containing request identity, consumers, source/final URL, status, timestamps, response metadata, content hash, normalized text evidence, provider-page signals, and the prior receipt hash. Raw response bodies are never retained.

A checkpoint records the last receipt hash and completed request IDs. Re-running the same plan skips completed work. A final manifest signs the ordered receipt hashes and summarizes budget use and outcomes.

## Failure model

Failures are explicit terminal or retryable statuses, never silent skips. Expected statuses include robots denial, unsafe destination, unsupported content, timeout, response too large, HTTP failure, redirect limit, and budget exhausted. Partial runs remain auditable and resumable.

## Verification

- Unit/acceptance tests use an injected transport and resolver; no real network is required.
- Tests cover signature tampering, confirmation mismatch, SSRF rejection, robots decisions, redirects, size limits, request/byte budgets, deduplication, and receipt-chain resumption.
- CLI dry-run verification proves zero network and zero writes.

## Deferred

Provider identity scoring, service extraction, AI enrichment, human review, database import, and public-map promotion remain separate gated stages.
