# Progress receipts

Workers write receipts in their own branches, never concurrently into the central
FLIGHTPLAN file. Name: `<PROJECT-ID>-<YYYYMMDDTHHMMSSZ>.md`.

Include: project ID; UTC timestamp; branch/head; worktree; completed milestones
and evidence; remaining work; blockers/decisions; exact check results and revision;
user review; PR/CI/merge/deploy/provider status; localhost URL/PID/cwd; remote backup
ref/hash and verification time; private-state backup gaps; next action.

Commit and preserve the receipt through the approved backup route. Return its
path and commit to the orchestrator. Never include secrets or private evidence
in a public repository; link an appropriate private receipt by safe identifier.
