# Fiscal submission project-settings constraint failure

Workstream03 stages3/6. `fix/fiscal-project-options-20261015` in the existing
fiscal-completion checkout, base main867ad7a1 (CAPTCHA removal merged).

## Confirmed cause

Caleb reports HTTP503 after submitting the production form without CAPTCHA.
A read-only production receipt probe succeeds. Guest submission count is zero.
A bounded Postgres log query finds SQLSTATE23514 at2026-10-15T19:43:44.985Z:
`organization_project_option_settings_object` rejects `organization_projects`.
Read-only catalog queries confirm the existing production constraint requires
`tags` and `sprintTypes` arrays, while both `submit_guest_fiscal_application` and
`start_public_fiscal_intake` insert only `fiscalSponsorshipEnabled:true`.

Both variants reproduce the exact constraint violation locally after installing
the actual20260920150000 project-options migration in the fiscal test database.
The old fixture omitted that migration and incorrectly defaulted options to{};
that gap let the earlier connected test pass. Defaults now match the real
nullable option-settings column. Remaining production project/application CHECK
constraints and required application columns were inspected read-only; the
identified settings shape is the concrete mismatch. No real submission is run.

## Correction

New migration20261015200000 adds empty `tags`/`sprintTypes` arrays while preserving
the fiscal-enabled flag. It patches exactly one known JSON literal per installed
intake function, preserving the current body, owners, grants and security settings.
Unexpected or ambiguous definitions fail closed; already-corrected functions are
a no-op. Other constraints, authorization, RLS, validation, rate limits, receipt
idempotency, email/outbox and CAPTCHA-free UI remain unchanged.

The local runner now applies the actual constraint migration before both intake
paths and the correction twice to test reapplication. Guest assertions require
the exact normalized settings. The full fiscal SQL/RLS matrix, anonymous/owner
intake rules, guest atomic handoff/outbox/denials and connected real-handler
journey pass. Both paths failed before the correction. Focused submission/retry
checks and normal prepush also run before handoff.

## Production boundary and rollback

This is a database-function fix. A web merge/build alone does not apply it.
Apply only20261015200000 after production migration authorization; do not run a
bulk database push that could apply other workstreams' pending migrations.
The PR-only delivery contract leaves production application pending approval.
No production schema, settings, application data or email changed in this run.

Original production definitions/owners/ACL/config and relevant catalog evidence
are saved privately at
`~/.local/share/coach-house/fiscal-completion/2026-10-15/project-options-before.json`.
Before application recheck the exact function definitions and migrate atomically;
verify both normalized literals, unchanged ownership/ACL/security, intact
constraint, and migration ledger. Rollback restores only the saved function
definitions (which restores this known intake failure); never weaken the table
constraint. A controlled actual application/mail test remains Caleb-owned.

Keep actual localhost3127, other lanes and shared SHIP40 hold. Do not bring back
CAPTCHA or resume key troubleshooting. Stop at the open PR/production approval.
