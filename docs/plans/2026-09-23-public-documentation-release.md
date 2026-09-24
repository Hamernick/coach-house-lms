# Public Documentation release lane

Branch: `feat/public-documentation-release-20260923`
Worktree: `/Users/calebhamernick/Development/coach-house-platform-public-documentation-release-20260923`
Local preview: http://localhost:3012/documentation

## Scope

Carry the existing public nonprofit Documentation content lane onto fresh `origin/main` (`0c5dbe39`). Keep Workspace Particles, AppShell/mobile, and People/profile work out of this lane. Correct stale profile/directory claims and fixtures, keep the public Documentation search usable without duplicating the global public search, preserve content scrolling, support onboarding-locked viewers, and include public Documentation routes in the sitemap.

## Changes

- Corrected public marketplace and home copy to match the tools, offers, and resources presented by this lane. Removed the obsolete People fixture from the Documentation visual fixture and retained the marketplace People UI as existing marketplace behavior.
- Added one Documentation search row to the anonymous Docs shell, suppressing the duplicate global public search only on that shell.
- Kept the Documentation surface constrained to viewport height so article navigation and scroll tracking continue to work.
- Raised the shared desktop Build/Collect navigation above the Documentation shell and added a browser assertion that verifies the menu is the actual top hit target over page content.
- Allowed onboarding-locked users to read public Documentation.
- Replaced planner URL history mutation with Next router navigation to avoid router initialization errors.
- Added a sitemap builder for live Documentation routes and resource detail routes; excluded search/visual fixtures and retained published profile URLs in the existing sitemap.
- Added focused browser journeys and sitemap acceptance coverage. Restored existing planner visual coverage.

## UX review

Review the preview at `/documentation`, `/documentation/search?q=finance`, `/documentation/quickstart`, `/documentation/marketplace`, `/documentation/tools/brand-identity`, and `/documentation/best-practices/frameworks`. Check desktop and mobile widths, light and dark themes, public search behavior, mobile navigation, article contents/scrolling, and planner step navigation/state persistence. The local Mac screenshot runner reports expected baseline differences; do not update canonical image baselines from this host. Canonical Linux visual validation remains required.

## Ship gates

- Focused and full static checks and acceptance tests pass.
- Production build passes under Node 22.
- Run `pnpm check:quality` on the exact proposed head in the supported Ubuntu 24.04 x64 / Playwright environment; resolve visual differences and update only reviewed Linux baselines if intentional.
- Run `pnpm test:rls`; report any live suite skipped for missing provider credentials. This public-content lane has no database or provider mutation.
- Review `git diff --check`, feature scope, sitemap output, and full UX journeys.
- After Caleb approves the preview and UX, stage-secret check, commit, push, then inspect exact-head hosted checks. No push, merge, or deployment has occurred.

## Executor handoff

Continue in the branch and worktree named above. The Documentation source commit has already been replayed onto fresh `origin/main`; do not replay it again or combine another lane. Preserve all current staged and unstaged changes. Node 22 is at `/Users/calebhamernick/.nvm/versions/node/v22.13.0/bin`; the local preview is already running on port 3012, while root port 3000 belongs to another worktree.

After UX feedback is resolved, run in this order:

1. `pnpm check:quality:static`
2. `pnpm check:quality:acceptance`
3. `pnpm test:rls`
4. `pnpm check:quality:build`
5. On Ubuntu 24.04 x64, run `pnpm check:quality` on the exact candidate head. Review every changed screenshot; use the repository's visual update command only for intentional, approved UI changes and include rationale in this plan/runlog.
6. `git diff --check`; inspect the staged and unstaged name/status lists and verify no People/profile, Workspace Particles, AppShell/mobile, generated cache, or temporary test config entered the lane. Run the repo-prescribed staged secret check before committing.
7. Only after Caleb's explicit preview/UX approval, commit and push this lane, then inspect exact-head hosted checks. Do not merge or deploy as part of this handoff.

Current local evidence: static and acceptance passed, focused sitemap and public navigation acceptance tests passed, build/performance passed, local RLS passed with the live Supabase suite skipped, and focused browser interactions passed. The Documentation menu layering journey and scoped ESLint passed after the follow-up z-index fix. Canonical Linux screenshots and Caleb's UX review are still open.
