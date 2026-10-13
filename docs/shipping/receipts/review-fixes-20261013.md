# Automated review fixes

PR #291 revision `066ee9e40c8f5a8443a59acec3cc87f33048f541`, shared revision 13.
This supersedes the earlier handoff's implementation revision. No approval recorded.

- 4254822559: blocked merged/deployed/production-verified slices retain their
  released head guard through checkpoint and resume; rejected writes leave state
  byte-identical. Pre-release changed-head recovery remains valid.
- 4254822567: all receipt IO checks generated basenames and resolved direct-child
  containment; traversal, absolute/nested/reserved names and symlinks are rejected.
  The isolated ../config exploit no longer writes its victim. Payload validation
  completes before restore writes; initialization holds the exclusive store lock.
- 4254822575: restore verifies the snapshot filename against its revision and
  full-state digest before child import. Altered scope/revision with unchanged
  child receipts is rejected. This detects corruption, not authenticated authorship.

27 runner tests pass (8 new review regressions); staged gitleaks, diff hygiene and
normal Node 22 pre-push pass. Original legitimate export/restore, owner restart
and pre-release checkpoint tests still pass. The original findings were reproduced
against the prior source in disposable fixtures, never against real Git config.

Current-head CI and reviewer acknowledgment remain pending. No review comments
were marked resolved, no messages were sent to reviewers, and no merge/deploy occurred.
The user explicitly withheld approval pending explanation; do not infer approval.
