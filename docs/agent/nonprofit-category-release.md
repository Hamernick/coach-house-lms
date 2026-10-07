# Nonprofit category release

Resume the [category plan](../plans/2026-10-07-national-nonprofit-category-filters.md) and permanent `~/.local/share/coach-house/nonprofit-enrichment/CURRENT.json`. Private mapping/backfill code remains in its located research checkout. This release contains serving code only.

## Deployment order

1. Require current-revision hosted quality and branch protection. Review the category surface; do not blindly update visual baselines.
2. Apply `20261007070000`, `20261007070100`, and `20261007070200` through the existing migration process. Existing directory v1 RPC and identity publisher remain valid. No preview capacity or paid settings change.
3. Run the saved category plan with the private `publish-categories.mjs --mode publish --input <state>/category-plan-50k-20261007 --target vswzhuwjtgzrkxknrmxu --confirmation <manifestHash-from-plan.json> --max-chunks 1 --write`. Credentials come from the existing local environment, never command arguments. Omitting `--write` performs no network or disk writes.
4. Verify that chunk's remote receipt, exact category assignments, anonymous category/text/state results, hidden listings and specific-service exclusions. Owner/staff/suppression protections apply in the transaction. Keep the existing identity publisher independent.
5. Deploy the category client and continue bounded saved chunks with public health checks. Start subsequent plans strictly after the prior plan's `lastEin`; do not recreate completed plans. Use `--retry-from <processed-plan>` with a new output to retry pending identities once they are published. Held conflicts need reconciliation, not forced overwrite.

## Meaning and limitations

IRS classes describe organization topics, not confirmed available services. Empty, unsupported and conflicting source codes stay unclassified but searchable. Topics are exact top-level matches; service leaves need separate evidence. No pins are created. Classification provenance, receipts and original codes remain private.

The search response retains the v1 item allowlist; the new cursor is v2 and binds query/state/category/taxonomy. Older cursors must restart at the first page. No national totals are computed per request. Loaded-resource counts are not national totals; category controls omit unavailable totals and remain enabled.

The service classifier advances to `coach-house-taxonomy-v2` for the promoted parents; stable leaf IDs and old leaf URLs remain valid. Existing curated assignments are not mass-reclassified by this release.

## Rollback

Rollback the client first if required; v1 search remains available. For an incorrect category chunk, call `rollback_nonprofit_category_chunk(batch,chunk,target)` through the service-role operator. It restores previous category sets only while its applied revision is current and the identity remains import-managed; later owner/staff changes are preserved. Replaying a rolled-back publication chunk fails explicitly. Keep receipts and manifests; do not drop tables or delete identity data to undo a category release.

To reverse navigation promotion, restore the four stable leaves' `parent_key` to `community` in a reviewed follow-up migration. Retain new category rows while assignments reference them. Table removal is unnecessary for operational rollback.
