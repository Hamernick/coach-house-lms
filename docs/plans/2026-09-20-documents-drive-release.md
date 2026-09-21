# Documents release continuation

## Branch and scope

- Worktree: `/Users/calebhamernick/Development/coach-house-platform-documents-release-20260920`.
- Branch: `feat/documents-drive-release-20260920`, created from freshly fetched `origin/main` at `4458a497` (merged internal-tooling PR #242).
- Local branch only; no commit, upstream, push, PR, or deployment from this session.
- Root `chore/local-development-20260907` and localhost:3000 are preserved. Root had 307 unstaged and 214 untracked paths, including newer Documents/Drive work. Do not merge that entire branch or copy its entire working tree into this release.
- Scope is the upcoming Documents release and its direct dependencies. Preserve current production public pages and unrelated design work.

## Production Drive evidence

- Authenticated `https://coachhouse.app/workspace?drawer=tools` renders Google Drive under Installed with a checked connection switch and the current user's connected Google account.
- Production source includes Workspace Tools connection/disconnection controls, OAuth routes, encrypted token storage, Picker token service, and selected-file attachment/import services.
- Vercel CLI metadata for the existing `coachhouse` project confirms all eight required `GOOGLE_DRIVE_*` variables exist in Production. Secret values were not retrieved or changed. Presence does not establish that each value is valid.
- The connection status endpoint reads the saved database status; it does not validate or refresh a Google token. The visible Connected status is not proof of current provider access or fresh-user consent.
- The current production Documents tab is the older table/upload interface and has no Drive file-selection entry. The newer Documents library and Picker surface remain outside this branch.
- No OAuth grants, provider settings, connections, document records, or Google files were changed during verification.

## Next implementation and release gates

1. Review and extract the intended Documents UI and direct dependencies from the preserved root working tree into this production-based branch. Inspect uncommitted files as well as branch commits; do not pull unrelated Marketplace or Particles changes.
2. Keep connection management in Workspace Tools and file selection in Documents. Preserve selected-file scope, server-side organization authorization, encryption, and existing Calendar/login grants.
3. Verify fresh-user OAuth consent and callback, Google Picker, selected-file attachment/import, and save/reload with an explicitly selected account/document. No real file was selected in this session. The existing user's connection must not be disconnected merely to stage a fresh-user test.
4. Confirm production Google OAuth audience permits intended users. Do not infer audience/publishing status from a previously connected account.
5. Run focused Drive/Documents checks, then the required full quality gate before shipping. No code changed and no new test run or release certification is claimed in this branch-setup session.

No Tools activation patch is currently indicated: its production controls already render. End-to-end document connection remains an explicit release gate.

## 2026-09-21 implementation status

- Extracted the scoped Documents library into this production-based branch: grid/list views, search/filtering, previews, batch actions, storage usage, uploads, Recently Deleted, attached Drive files, and Notes.
- Empty Core Documents now offer `Start writing` or `Choose from Google Drive`. The editor exposes the same Drive choice beside its paste control.
- Core Document cards have an accessible top-right menu with Edit, Google-branded Replace, and confirmed Remove. Linked Drive documents keep their canonical Coach House title and open the validated Google Drive URL.
- Source changes are authorized server-side against the signed-in user, active organization, edit role, selected Drive file, and current document version. Saved editor content is retained when Drive replaces the visible source; unsafe persisted links are rejected.
- Final Node 22 `PLAYWRIGHT_PORT=3031 pnpm check:quality` passed all 21 stages in 399.01 seconds: 2,550 acceptance tests with one expected skip, all RLS suites, production build, 48 visual tests, and performance budgets. Graphify updated to 18,149 nodes and 51,231 edges.
- Live fresh-user OAuth, Picker selection, and selected-file save/reload remain external release checks. No provider settings, production data, deployment, or live Google file changed.
