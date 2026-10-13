# Checkout recovery ledger

Scope: recent local code and plans not yet pushed to GitHub. The user confirmed
private files already have cloud backups; reviewing those backups is out of scope.

## Snapshot inventory

Before creating FLIGHTPLAN, 105 worktrees were registered: 93 paths existed,
12 registrations pointed to missing directories, and nine existing checkouts were
dirty. The root had three local documentation changes and no upstream.
56 existing checkout HEADs were not reachable from current origin refs. This is a
conservative recovery signal, not proof that their features remain unshipped:
squash merges and deleted remote branches can remove that reachability.

The new orchestration checkout adds one present worktree. Existing localhost
servers on 3000 (frontpage) and 3008 (Particles) are preserved.

## Preservation method

- Leave original branches, files and indexes in place. Never commit another chat's
  working copy or reset it to make the audit clean.
- For an already remotely reachable clean HEAD, record that reference.
- Otherwise create a dated `chore/recovery-<UTC>/<source-branch>` branch containing
  complete file snapshots based on current main. Include separate committed,
  staged (when distinct), and working states as needed.
- Original HEAD IDs remain provenance in commit messages; mixed historical commit
  chains are not replayed. Recovery preserves file states, not every intermediate
  local commit. Do not merge these snapshot branches into main.
- Preserve tracked files and nonignored untracked files. Existing ignored/private
  state remains on the user's separate cloud-backup route.
- Scan new outgoing blob contents for secrets. Existing remote-reachable objects
  are already on GitHub; newly introduced content must pass before upload.
- After pushing, verify exact hashes with `git ls-remote`. Independently fetch and
  restore a snapshot in a disposable directory to test recovery.
- Snapshots have a cutoff time. Work done afterward needs another checkpoint.

Detailed private capture and scan records:
`~/.local/share/coach-house/flightplan/CURRENT-RECOVERY` points to the JSON manifest.
The [public ledger](recovery-ledger.md) records every checkout's source and verified recovery ref.

## Retention

All existing checkouts are retained. No reset, clean, deletion, pruning, merge,
provider mutation, or application release is authorized by this backup task.

Active: retain the worktree and record the owning branch, preview and next action.
Inactive: retain until its remote snapshot and handoff are verified. A subsequent
explicit cleanup can remove an idle checkout without removing its recovery branch.
Missing: preserve the surviving Git snapshot. A missing directory's historical
uncommitted files cannot be recovered from Git unless a separate copy exists.

## Restore on another computer

Clone `https://github.com/Hamernick/CoachHouse.git`, fetch origin, and use the exact
recovery branch from the ledger:

```sh
git worktree add -b chore/resume-example ../coach-house-resume origin/<recovery-branch>
```

Open that checkout, read its instructions and handoff, then reconcile with current
main before implementation. Restore existing private environment/data through the
user's normal cloud-backup process. Reinstall dependencies and start only the
assigned preview port after checking its owner.

## Verification

- Verified 2026-10-13T01:00:46.590367+00:00: 65 new recovery branches match exact GitHub hashes;
  40 clean states remain reachable from live remote tips.
- Nine dirty checkouts / 874 changed or untracked paths captured. Working files
  are preserved in addition to committed states; no original worktree was switched.
- 793 new outgoing blobs / 14.98 MB scanned with zero findings. Mixed local
  history was intentionally excluded, including historical scan findings.
- Fresh GitHub clone of root recovery snapshot `b69cc0a9c8340159f249c06d8159f62fd12ed2d3`:
  tree `0194eb73e528732011e1398939556cf4335bc444`, clean checkout, git fsck passed, and the previously
  untracked Calendar plan restored successfully.
- All original checkouts retained. Twelve missing-directory registrations remain
  documented; their surviving Git state is recoverable, while historical uncommitted
  files from already-missing directories remain unknown.
- Complete restoration mapping: [105-entry ledger](recovery-ledger.md).
- FLIGHTPLAN is separately pushed on `chore/flightplan-20261012`.
- Backup snapshots are not release candidates and do not establish application QA.
