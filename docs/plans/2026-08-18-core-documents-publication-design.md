# Core Documents publication design

## Goal

Make the six public-profile Core Documents the source of truth for the
narrative fields shown on an organization's public `/find` profile. Their
existing status control becomes an explicit publication control:

- `Not started`: gray and private.
- `Draft`: amber and private.
- `Public`: green and visible on the public organization profile.

## Approach

Keep the stored `not_started`, `in_progress`, and `complete` values so existing
roadmap, readiness, and workspace projections do not require a broad data
migration. Present those values as `Not started`, `Draft`, and `Public` in Core
Documents. Treat `complete` as the publication gate for the six public profile
narratives: Origin Story, Need, Mission, Vision, Values, and Theory of Change.
Other roadmap sections retain their existing progress labels because `/find`
does not expose them.

Existing public profile fields remain visible until a user activates the new
publication control. This avoids a data migration and prevents the release from
silently removing public content. On the first edit or status change, the
application records that the Core Document is publication-controlled. Moving a
public document to `Draft` retains its last public version while keeping the
replacement private; moving it back to `Public` replaces that version. `Not
started` unpublishes it.

All six narrative write paths use the same roadmap sections. This includes the
Core Documents editor, the organization profile editor, and mapped assignment
answers. Existing root profile values remain as compatibility data but are no
longer updated by those editors.

## Save and cache flow

Changing status saves the current editor draft and status together so `Public`
never publishes an older autosaved version. Successful saves and deletes for
the six public-profile sections invalidate the tagged public-organization cache
and revalidate `/find`. Failed saves keep the local draft and show the existing
error feedback.

## Verification

Focused acceptance coverage must prove legacy fallback, draft privacy, public
projection, the three new labels with existing colors, atomic status saves, and
public-map cache invalidation, last-public-version preservation, and canonical
profile/assignment writes. Run focused lint and acceptance tests before the full
quality gate.
