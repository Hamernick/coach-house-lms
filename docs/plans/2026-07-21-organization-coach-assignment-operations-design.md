# Organization Coach Assignment Operations

## Goal

Make the existing per-organization coach picker usable across the full organization portfolio without enabling assigned-only coach access before mappings are complete.

## Approach

Add a compact developer-only assignment operations bar to `/organizations`. It reports canonical organization coverage and provides one URL-backed filter with `All organizations`, `Unassigned`, and each coach. This is preferable to mixing coach ownership into the existing project-member filter because those concepts have different authorization and data sources. It is also smaller and safer than introducing a separate bulk-management page before the workflow requires one.

Coverage counts use canonical organization cards only, so standard organization projects cannot inflate the denominator. Filtering still applies by stable `organizationId`, allowing related standard projects to remain with their organization when a coach filter is active. The filter is stored as `coach=unassigned` or `coach=<user-id>` and is preserved when status, priority, tag, member, view, ordering, or property options change. Invalid or removed coach identifiers fall back to `All organizations`.

## UI and States

The bar shows `assigned / total`, an explicit unassigned count, and a labeled shadcn Select. Counts use tabular numerals. Mobile targets are at least 44px; desktop controls remain compact. Empty filtered results show a recoverable state with a clear-filter action. Long coach names truncate without changing control geometry.

Only developers see assignment operations. Coaches retain read-only assignment labels on cards and details. No RLS, mutation, assignment table, or coach visibility policy changes in this segment.

## Next Gate

After production assignments cover every organization, add a separate database-backed activation switch and enforce assigned-only organization reads server-side. The switch must remain disabled while any organization is unassigned.
