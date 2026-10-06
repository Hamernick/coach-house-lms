# IRS nonprofit directory publication

This contract governs source-backed organization listings. The [resource-map service contract](resource-map-enrichment.md) still governs actionable services. Do not create fake services to publish an IRS identity, and never connect the raw research queue to public search.

## Admission and public fields

- Require an exact EIN/name match to retained IRS BMF data, original source hash integrity and the recorded audit policy. Keep source dates and unknown status explicit. No phone, website, service, category or coordinate minimum applies to an organization identity.
- Publish only the audited projection: EIN, name, filing city/state/ZIP, independently eligible website/phone/mission excerpt and field basis/filing period. Omit raw evidence, exact filing street, private contacts, claim tokens, relationships, logos and inferred service categories.
- Label these as IRS-listed organizations with unconfirmed current status/services/visiting locations. Source-reported contacts are not freshly provider-confirmed. An organization listing produces no map pin.
- Existing platform organizations, curated resource-map organizations, manual management and suppression win. Recheck during each write, and filter later ownership/curation changes out of directory reads. Never overwrite account-owned organizations or the approved service catalog.

## Storage and access

`nonprofit_directory` contains the serving projection. `nonprofit_directory_settings`, `nonprofit_publication_runs` and `nonprofit_publication_chunks` are private. All four tables have RLS; anonymous/authenticated direct reads and writes are denied. Only narrowly parameterized security-definer search/detail functions expose a fixed projection. Functions pin their search path. The projection view has no public SELECT privilege; predicate pushdown is needed for indexed full-text search.

Search is cursor-based and bounded (API 50 default, 100 maximum; UI 20). Cursor binding includes query and state. No exact national count or full-corpus browser download. Registry results are a separate section for text searches across all categories; specific service filters continue to use approved service evidence.

## Release and publication sequence

1. Pass current-head hosted `quality`, required code-owner review and branch protection. Preserve unrelated work; ship only scoped directory changes. Review public search appearance/interaction; no preview deployment without user authorization.
2. Apply only the reviewed directory migrations and reconcile migration history. Do not run a broad database push that applies unrelated pending migrations. Installing the schema does not publish any record.
3. Bind `nonprofit_directory_settings` to the exact reviewed Supabase project and policy, initially with `publication_enabled=false`. Deploy and verify anonymous search/detail APIs.
4. Use the completed audit to prepare an immutable directory projection. `plan-publish` does live read-only preflight and saves expected previous digests, holds, target, authorization reference and hashed chunks.
5. Once serving/release checks pass, explicitly activate publication for that target/policy. `publish` requires `--network --write --target <ref> --confirm-plan <hash>`. Existing user publication authorization is recorded in the manifest; do not ask again for each organization.
6. The first successful chunk is checked through anonymous detail access, then the process continues the full eligible manifest. A canary is not a publication ceiling. Each transaction saves the data and its receipt together. Resume from database receipts after a lost response; never infer success from a local counter.
7. Reconcile receipt outcomes, actual database rows and public search results. Keep inserted, updated, unchanged, held and replayed counts separate. A private research overview is not a production census.

Initial chunk bounds: 1,000 rows and 2 MB. Wrong hashes/targets and changed manifests stop the run. Changed previous digests or ownership are held. Audits older than seven days must be refreshed against saved evidence before publishing; this does not require new browsing. No paid services or new hosting purchases are introduced.

## Rollback

Service-only `rollback_nonprofit_directory_chunk(batch,chunk,target)` restores prior content or suppresses newly inserted records only when their revision/digest still matches the affected publication and they remain import-managed. Later edits and suppressions survive. A rolled-back chunk cannot be silently republished through its old manifest.

## Current boundaries

The first release covers registry identities and available audited fields. Full-corpus versioned imports, alias/taxonomy expansion, spatial pins, richer source adapters, automatic refresh scheduling and national-size performance validation remain separate work. Local PostgreSQL test results do not establish production latency or national capacity. Check the [release continuation](../plans/2026-10-06-nonprofit-directory-release.md) and current monthly log for actual release/data progress.
