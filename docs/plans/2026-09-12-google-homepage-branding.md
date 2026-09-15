# Google homepage branding follow-up

## Result

Prepared a 21-line homepage improvement in
`src/components/public/public-map-index/directory-home.tsx`, below the NFP claim
prompt and before the existing Privacy/Terms links.

The section visibly names Coach House, explains the nonprofit workspace and
resource directory, and describes the optional Google connections in plain
language. It uses existing text/theme tokens, 4px heading grouping and 8px
paragraph spacing from `docs/design.md`. No interaction or authentication logic
changes.

## Evidence and scope

- Live Google project `coach-house-496700` still reports branding verified and
  data access under review. The branding-guidelines review stage contains no new
  actionable finding; it says review is in progress.
- The configured name is Coach House; homepage, Privacy and Terms URLs match
  the public site. The existing app-name appeal was already submitted at
  2026-09-12 05:40 UTC. No provider setting was changed in this follow-up.
- The live homepage emphasizes the resource map. This improvement makes the
  app's identity, broader purpose and Google-data use explicit in its drawer.
- Google's [homepage guidance](https://support.google.com/cloud/answer/13807376)
  asks for clear app identity, functionality and purpose of Google-data access.
  Its [branding guidance](https://support.google.com/cloud/answer/13804963)
  requires consistency with the consent-screen identity. The current name/logo
  are retained to match the submitted video.

## Local status

- Branch: `fix/google-homepage-branding-20260912`, based on `origin/main`
  `cb9287b1`, which includes the deployed homepage legal links.
- Root `chore/local-development-20260907` and its unrelated dirty work preserved.
- Targeted ESLint passed; all 35 existing public-map sidebar layout tests passed;
  `git diff --check` passed. No additional tests were introduced for static copy.
- Browser visual review did not complete. The isolated Turbopack server rejected
  the shared dependency symlink; the webpack preview stalled during initial
  compilation, and browser access timed out. The extra server was stopped.
- `graphify update .` completed AST extraction but remained busy updating the
  graph. Stopped the extra indexing process; this worktree's graph is not claimed
  current. The root graph was not changed.
- No commit, push, PR, deployment, or production Calendar activation. Full release
  quality checks and visual review remain before publishing this local patch.

## Next

Review the small homepage diff, complete responsive light/dark visual checks in
the isolated worktree, run the required release checks, then publish through a
small PR. After deployment, confirm the public text and links. Handle any Google
review email in the existing submission; final approval remains Google's decision.


## September 14 release review

- PR #236 is an independent change against main. Its original published head
  ef0bf7ab passed the complete quality CI.
- Hosted preview reviewed in Bandto Chrome at desktop width and 390px: the
  About section sits below the NFP claim prompt, above working Privacy/Terms
  links, with wrapping text and no added controls. Preview resource data is
  empty; the existing mobile map-control overlap belongs to #235.
- Corrected release wording: production supports optional Google Sign-In and
  Drive connection management; Drive file import and Calendar syncing remain
  in unreleased PRs. The homepage now explicitly describes those as coming soon.
- Current production verified in Vercel: calebs-projects-58ab1538/coachhouse,
  deployment 8FNjMjaMmPP389fbKy1W1QQwV5kP, source main/cb9287b1, Ready,
  with coachhouse.app and coachhouse.vercel.app assigned. Production environment
  branch tracking is main. The separate coach-house-platform project also
  builds PRs but does not establish ownership of coachhouse.app.
- Local Vercel CLI authentication returns 403 Not authorized; used the existing
  signed-in Bandto Chrome profile for read-only provider verification. No
  credential, provider setting, database, main merge, or production change.
- The corrected commit needs its own passing CI and final hosted copy check,
  then normal code-owner approval. Do not bypass branch protection.
