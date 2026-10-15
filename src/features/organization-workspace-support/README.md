# Workspace support

The existing organization switcher lists memberships and the current temporary
workspace. Explicitly granted staff can search by organization name/slug, owner or
member name/email, including unnamed workspaces. Search uses at least two characters,
ranked twenty-result pages, contact identity and visible totals/errors/retry. Empty
search stays local; selecting an organization creates no membership.

Search uses a same-origin, no-store JSON request outside the server-action queue.
After ten seconds it aborts and shows Retry; changing query/page or closing the
switcher cancels the obsolete request. The endpoint reuses the existing authenticated
search and live support-grant RPC.

## Authorization

`workspace_support_grants` is operator-managed and private. A grant requires an
existing active staff/Auth account. Neither a coach/developer role nor client
metadata automatically grants this feature. Search, selection, reads, writes and
presence recheck the current grant. Policies scope support access to the request's
organization ID; ordinary membership permissions remain unchanged. Fresh verified
staff presence is required by the existing general workspace write policies. Native document text, metadata, hero images, inline images and history use separately authorized server operations with the verified actor; they do not weaken the shared RLS helper or depend on decorative presence.

`WorkspaceOrganizationScope` adds the page's immutable organization ID to
same-origin fetches, including Next server actions, preserving bodies/options and
never sending the scope to external providers. Allowlisted native-document endpoints preserve their explicit organization header so an admin asset dialog can target a different organization; all other calls remain pinned to the tab. The scope header is not a credential.
The proxy overwrites request-method metadata. Unscoped support mutations fail;
revoked explicit targets never silently fall back to another writable workspace.
The existing document pending-change guards run before selection changes the cookie.

The support session keeps the actual staff identity. Organization writes and
support entries/grants have private audit events. Personal OAuth connections and
checkout/billing portal mutations are blocked while supporting another workspace.
No organization-delete, owner-transfer, staff-grant, fiscal-signature or private
internal-note privilege is added. Invites retain existing authorization rules.
Verified assistance may edit free-workspace documents without changing subscriptions
or unlocking paid features for members.

## Presence

Database RPCs bind names and actor IDs to authenticated users. Same-page normalized
cursor coordinates use the existing Cursor component. Presence stays active without
adding support-session banners or a textual viewer/editor roster to the sidebar. Hidden/presentation tabs retain viewing presence without cursor
movement. Polling uses same-origin HTTP outside the action queue, a five-second deadline, one in-flight request per tab, a two-second baseline and capped eight-second backoff with jitter; stale sessions
expire after15seconds and revocation filters them immediately. Presence errors no longer inject a paragraph into navigation. Document cursor availability appears in the document status region without changing persistence or edit access. Legacy cursor
publishing is suppressed for the support actor to avoid duplicate cursors.

## Rollout and tests

Apply20261014190000 and search follow-up20261014203000 only after local SQL/RLS checks. Provision exact verified Auth
IDs through a guarded operator transaction; no accounts are seeded by the migration.
Enable `NEXT_PUBLIC_WORKSPACE_SUPPORT_ENABLED` together with the document collaboration
flag after their migrations. Default is off. Test on actual localhost3124; user owns
interactive review. Required CI and code-owner review still govern merge.

Rollback: disable the flag and revoke support grants; retain audit/history. Existing
membership access remains intact. The focused acceptance tests cover search-list
behavior, cross-tab scoping, denial/revocation and request preservation. The existing
document-activity PostgreSQL runner covers actual support RLS/storage/audit/presence
permissions and ordinary-coach, suspended-user and revoked-staff denials.
