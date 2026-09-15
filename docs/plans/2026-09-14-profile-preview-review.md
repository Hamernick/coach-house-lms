# Proposed Profile verification preview

User authorized committing/pushing this branch and creating a hosted preview on September 14, 2026.
No production merge or deployment is proposed.

- Branch: `fix/profile-settings-completion-20260914`.
- Proposed draft PR base: `feat/documents-review-20260914` at `702b2a8d`.
  This isolates the Profile fixes from the inherited Documents/older-work bundle.
- Title: Fix unified Profile saving, publication, and email preferences.

## Proposed PR description

Saving from a different settings section could leave Profile edits unsaved while
clearing the unsaved-change warning. Saved identity fields also diverged from
the public page, and publication could overwrite other visibility settings.

Share desktop/mobile drafts, save personal/communication/public details together,
preserve failed edits, and guard View profile navigation. Add explicit public
bio/location/website editing and load-error retry. Synchronize public identity,
limit publication updates to visibility, and remove the redundant Person badge.
Connect email choices to preference/consent records and optional-email delivery
checks that respect unsubscribes and suppressions.

Validation already completed: all 16 static quality stages, 2,517 acceptance
tests (one skipped), eight isolated database suites, four browser behavior tests,
and two person-profile visual captures. Shared DB migrations were explicitly
authorized and applied; remote history, permissions, trigger, and all 159 copied
preference choices are verified. The restored Calendar migration only aligns
local history with an already-applied migration.

Full type/build/release checks and connected UI verification remain pending.
The local Workspace preview used approximately 411 percent CPU and 3.7 GB RSS
and was stopped. Run remaining expensive checks remotely. No profile values
were edited during this attempt. No production release is authorized.

## Browser check after preview is available

Use the existing Bandto Chrome profile. Record original fields, make a small
reversible profile edit, save from Communications, reload, verify the saved
state and public identity, then restore originals. Confirm public details and
unsaved navigation behavior. Do not change email subscription choices or send
mail as part of this UI check.
