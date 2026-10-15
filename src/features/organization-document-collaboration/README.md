# Organization document collaboration

Shared member/coach editor, behind `NEXT_PUBLIC_CORE_DOCUMENT_COLLABORATION_ENABLED` (default off). Review in the actual authenticated application; no synthetic review routes or in-memory persistence.

## Ownership

- `lib`: ProseMirror schema, step validation and rebasing support; no React or server imports.
- `server`: authenticate every operation, resolve explicit organization scope, enforce role/storage entitlement on writes, preserve verified actor identity.
- `hooks`: initialization/retry, pending edits, synchronization, presence and budget conflict decisions.
- `components`: use existing rich-text, budget and dialog primitives; preserve parent editor styling.

## Persistence and recovery

Migration `20261014160000_core_document_collaboration.sql` adds private, RLS-enabled session, presence and version tables. Only authenticated server operations can access them using an elevated client after authorization. The commit RPC locks the organization and checks both its revision and the document generation/version before atomically saving the profile projection and collaborative state. Whole-profile races retry against the latest row. Stale body replacements never silently overwrite unacknowledged edits.

Clients debounce typing by400ms and sync every2seconds. Opening and synchronization use a same-origin, no-store JSON POST endpoint outside the Next navigation/server-action queue, with a15-second abort deadline and explicit retry. The endpoint and backward-compatible action delegate to the same durable orchestration and optimistic revision checks. Presence/leave use a separate bounded HTTP endpoint; history remains a user-triggered server action. Saves never await presence or participant-profile lookups. Cache revalidation errors after commit are logged without changing the save acknowledgment. Public client exports live in client.ts; the root index is server-only. ProseMirror rebases simultaneous edits and local undo; it does not undo another actor's edits. Budget rows currently require an explicit choice on competing saves rather than silently overwriting one another. Actual live text/budget drafts are saved on local changes in versioned actor/org/section/tab-scoped local storage. Only acknowledged work clears that tab's copy. Reopening offers explicit restore/discard/download; blocked storage reports the limitation. Pending images require the tab to remain open until upload completes. Closing or switching with pending work retains the existing guards. Scope lifetimes abort obsolete requests and reject stale replies; revoked access locks editing while preserving recovery.

History captures existing originals (including legacy keyed sections), meaningful saved versions and deletions. Retention is latest100 versions plus daily checkpoints for30days. Restore is an ordinary new save, retaining the replaced version. Image cleanup preserves assets referenced by retained versions; automatic garbage collection of those retained assets is deferred. History shows verified saved actor names and budget contents.

## Release and validation

Apply the reviewed migration before enabling the flag. Keep the flag off to roll back application behavior; retain history tables/data. Never drop recovery data as an automatic rollback. No production schema change has been applied during this implementation checkpoint.

Focused acceptance: `organization-document-collaboration*.test.ts`, document access/write-safety and Drive-source action tests. `pnpm test:rls:document-activity` includes real local PostgreSQL checks for atomic revisions, originals, deletion/restore, legacy content, bounded history and blocked direct role access. Required hosted quality and review remain release gates.

All three entrypoints use `resolveDocumentCapabilities`: supported staff bypass paid-document entitlement through their live grant, ordinary members retain role/billing restrictions. The drawer no longer fetches the team-management member list. Explicit asset-dialog targets survive the ambient workspace fetch wrapper and reauthorize on the server.

`documentTrace` records safe request IDs, auth/capability/read/bootstrap/commit stages and committed state. Provider messages/content are excluded. Optional presence failures are sampled; routine timings require `LOG_SERVER_TIMINGS=1`.

Authenticated route coverage: `playwright.workspace-support-auth.config.ts`, using only an explicitly disposable loopback Supabase/Auth database. See the execution evidence document for exact environment prerequisites and current unrun gates. No complete-user-flow or timing result is implied by focused tests.
