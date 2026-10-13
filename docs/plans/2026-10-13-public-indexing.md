# Public indexing correction

Original inputs: `/Users/calebhamernick/Desktop/Coach House Codex Workstreams/WORKSTREAMS.md`,
full packet09 stage1, packet05 stage1, and outside-audit handoff section1.1.
Continuation authorized by the user's instruction to keep working through the
saved list and shipping code after reviewing the concrete audit findings.

## Change

`/community` already has a real member page. With public sharing disabled it redirects
anonymous requests to login, yet the sitemap previously advertised it unconditionally.
Sitemap inclusion and page robots now follow the same existing public-sharing flag.
The page also has an accurate title/description instead of inheriting scaffold copy.
Login/onboarding redirects and community invitations are unchanged. No profile data,
publication flags, entitlements, fiscal policy or provider settings are mutated.

## Verification

- Four focused tests pass: both sharing-flag states, preserved anonymous login gate,
  public profile/documentation sitemap entries, and existing Documentation sitemap coverage.
- Changed-file ESLint and acceptance manifest check pass.
- No visual behavior changed; no new appearance baselines required for this fix.
- Required hosted quality/code-owner review and exact-revision release approval remain separate.

## Remaining source findings

- Profile slugs reported as tests remain public; determine their intended publication
  state before changing records or adding an approval policy. Existing is_public filtering
  was verified; do not blacklist personal/organization slugs based only on their names.
- Fee wording has a material source conflict: the October outside handoff describes7%
  on incoming donations, while `docs/plans/2026-08-06-fiscal-sponsorship-policy-approval-packet.md`
  fixes the approved scope to grant allocations and explicitly leaves the fee base/trigger
  unresolved. Do not invent final fee copy or reopen the rejected in-app ledger.
- Three Workspace Tools visual references still reflect Stripe and omit Calendar Manage.
  Current/previous/difference artifacts are on the Desktop for the user's appearance review.

## Lane and recovery

Branch `fix/public-indexing-20261013`, worktree
`/Users/calebhamernick/Development/coach-house-platform-public-indexing-20261013`,
base `ce1436a2`. No dev server required for metadata-only changes.
SHIP-000's original release record remains preserved/blocked; this is an isolated
implementation candidate, not a fabricated closure or a second active release claim.
