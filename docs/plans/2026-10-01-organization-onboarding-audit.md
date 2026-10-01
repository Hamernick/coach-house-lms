# Organization onboarding audit — 2026-10-01

## Status and scope

Read-only production audit completed against the configured Coach House project `vswzhuwjtgzrkxknrmxu`. Database schema and project identity were verified before querying. No customer records, subscriptions, memberships, credentials or documents were changed. The local candidate has not been deployed.

User direction: implement the specific contract and document the result; use focused checks and required repository guardrails. Real signup/payment tests are deferred. The executor handoff's broad provider/manual matrix is not an active testing requirement for this iteration. Caleb subsequently authorized deployment after required hosted CI and actual GitHub review/protection; follow the [release executor](2026-10-01-onboarding-release-executor.md).

## Karen: current state and historical verdict

The requested identity matches the previously recorded owner UUID. Current persisted organization name, public slug and formation status are absent. The account's metadata says onboarding complete, intent `build`, workspace stage `2`; it has no organization memberships and has three coach assignments. Her own organization is therefore the normal owner context under the existing resolver.

Stripe was queried with a single read-only subscription retrieval: the existing Operations Support subscription is `active` and `livemode=true`. This verifies the subscription, not a complete invoice/payment-history audit. No billing operation was performed.

Saved work remains: 19 roadmap sections, seven containing content, the legacy Mission/Vision responses, and one live document-library record. Private profile/section/reference fingerprints were captured for preservation comparisons without exporting document bodies.

The retained journey query returned all **405 matching events**, reconciling with the scoped count, from July 14 through September 30. The recorded user key matches Karen's key on all rows; this is event attribution, not independent proof of which person operated each browser. Event types: 286 workspace views, one onboarding completion, one checkout start, 27 module-note saves and 90 homework submissions.

| Recorded UTC time | Evidence |
| --- | --- |
| July 14 01:11:50 | `onboarding_completed`, mode `post_signup_access`, tier `free`, `hasOrganizationSetup=false` |
| July 14 01:13:47 | Operations Support checkout started |
| July 14 01:14:31 | App subscription record created; Stripe subscription creation is consistent with this sequence |
| July 14 01:14:50 | Organization row created |
| September 29 16:57:49 | Current profile's latest update; retained document activity also records updates through this time |

The onboarding checkpoint also records `hasOrganizationSetup=false`. No later organization-setup completion appears in the retained events. No confidence/onboarding-response row exists for this user; that table does not store organization names.

**Verdict:** access-only setup bypass is proven at the July event. Whether she successfully saved a name at any later time remains **unknown**; the current evidence cannot support “she never entered it” or “a name save was lost.”

Coverage limits:

- Live schema discovery found no organization name/profile value-history table.
- Inspected organization triggers update timestamps, sync handles, track policy files and record document activity. Document activity keeps keys/titles and event types, not historical organization name values. Name references in that trigger concern document names.
- `updateOrganizationProfileAction` does not record old/new organization names in journey telemetry. Narrative revisions are not identity history.
- Backup metadata lists completed snapshots from September 24 through October 1, with PITR disabled. No listed backup covers July. No backup was downloaded, restored or provisioned elsewhere.
- Provider request logs were not exported. No claim is made that all possible historical logs or externally preserved snapshots have been exhausted. Current retained database evidence and source instrumentation cannot establish an exhaustive ever-saved verdict.

## Exact population counts

All **62 organizations** were inspected; the returned inventory reconciles with the database count.

| Population | Count |
| --- | ---: |
| Saved name present | 42 |
| Missing/invalid saved name | 20 |
| Literal stored `Organization` placeholder | 0 |
| Unnamed records with `build` intent | 16 |
| Unnamed records with unknown intent | 2 |
| Unnamed `find` member/test context | 1 |
| Unnamed `fund` member context | 1 |
| Named organizations missing another setup field | 2 |
| Total distinct records missing setup basics | 22 |
| Missing public URL among those records | 22 |
| Missing valid formation status among those records | 20 |
| Active/trialing non-stub subscription records among those records | 13 |
| Builder recovery candidates under the documented gate | 18 |
| Builder candidates with active/trialing non-stub subscriptions | 12 |

The subscription counts above are app-record counts. Provider mode/status was independently checked only for Karen. No payer was inferred solely from a Stripe ID prefix.

Every affected row has completion metadata set to true. Observed saved stages are `2` or absent; no early numeric stage was present. The local gate now accepts an integer stage of at least 2 as selected access, or an existing completion flag, to avoid treating arbitrary early/invalid numbers as proof of access selection.

Primary classifications are mutually exclusive and reconcile to 22:

| Classification | Count | Meaning/action |
| --- | ---: | --- |
| Confirmed legacy access-only completion | 9 | Exact `post_signup_access` / `hasOrganizationSetup=false` event; complete missing fields through existing setup after approved release. Later name-save history is still unknown. |
| Unknown, needs review | 11 | Current missing fields; insufficient retained completion/history evidence to assign a cause. Do not call these abandoned or failed saves. |
| Member context | 2 | Explicit Find/Fund path. Existing member exemptions remain; paid Fund account merits human intent review, not automatic conversion into a builder. |

Two affected records have a tester flag, as a secondary flag; one is within the legacy group and one within the member group. Tester status alone does not cancel a subscription or authorize deletion.

Private ignored evidence, mode 0600 in a mode-0700 directory:

- `test-results/onboarding-audit/organizations.csv`: account-by-account inventory and human-review status.
- `test-results/onboarding-audit/recovery-proposals.json`: 22 dispositions and expected current revisions, with **no proposed direct database mutation**.
- `organization-inventory.json`, `candidate-completion-events.json`, schema/trigger coverage, Karen timeline/checkpoints/fingerprints and Stripe read evidence.

The CSV is for Caleb/Paula/Joel's review. It has not been sent to anyone, and private results must not be committed or included in a PR.

## Existing Workspace editing path

Source-confirmed route composition supports `/workspace?drawer=organization&tab=company` for a configured/exempt authorized user. The visible company tab is **About**. Existing controls are **Edit**, **Organization name** in **Identity**, and **Save changes**. Formation status is in Identity; public URL is in the public-page settings section. No new rename control is required.

Authorization: owner/admin/staff organization roles may edit; server action resolves the authenticated actor and active organization and rejects other roles. Profile saves merge into the current saved profile, preserve unknown keys, condition writes on `updated_at`, and revalidate Workspace/organization views. Narrative revisions additionally protect stale narrative updates.

For Karen today, the old completed flag permits ordinary owner access in the recorded implementation. After the candidate deploys, missing basics will direct her to the existing onboarding setup first. A coach's applicable staff exemption preserves existing authorized client editing. Customer-specific saved data/role cookies have not been changed.

Local action verification adds identity to an incomplete fixture and preserves saved Mission/Vision/Values, document references, people and unknown fields. This is source/action-contract evidence. A real owner save/reload/new-session/second-viewer check was not performed on Karen or a real test account, following the user's deferral of extensive testing.

## Implementation contract

1. Owner/build setup requires a persisted nonblank name, public URL and one supported formation state. Payment/access selection or tutorial progress alone does not complete setup.
2. Staff, invited organization contexts and completed Find/Fund/Support members retain their established exemptions. Unknown-intent records remain in human review; no customer category is inferred from billing alone.
3. Fresh access choice transitions to setup without false completion. Legacy paid recovery uses the existing setup and plan; no repeat checkout or billing write.
4. Name validation uses the same 1–120 character, trimmed/nonblank contract in onboarding submission and Workspace client/server saves. An omitted name in a partial document/brand patch remains permitted; an explicitly blank name is rejected before a write.
5. Required setup loads the authenticated user's existing personal handle from the existing registry and passes it as the current/default handle. A failed read fails rather than offering a blank replacement identity. Uniqueness/claim checks remain in force.
6. Profile queries must fail on errors rather than treat inaccessible saved data as a fresh empty record. Merge/revision handling preserves documents and paid identifiers.
7. Recover account-specific fields only through customer input or a separately reviewed, guarded repair supported by historical evidence. No mass renames, metadata resets, deletions or inferred Offshootz name write.

## Prevention and recovery

[Repeatable read-only check](../operations/onboarding/incomplete-builder-audit.sql) lists completed builder-owner records missing basics. Record the deployed fix's activation time when shipping: older rows are a known owner-input backlog, while newly created/completed affected accounts require investigation. The SELECT-only query was verified against the audited production project and returned 18 builder candidates. It does not create an alert, scheduler or provider service.

Human review remains: classify the 11 uncertain cases, validate the two unknown-intent accounts and the paid Fund context, and confirm appropriate owner-facing instructions. Current proposal: 18 builder accounts finish existing setup; four nonbuilder/unknown-intent accounts receive human review. No direct customer database repairs are proposed.

Next release step: follow the rigid release executor to isolate the runtime candidate, pass required hosted CI/review, then deploy under Caleb’s existing authorization. Real-provider testing is explicitly deferred and must be described as such in release evidence, not represented as passed.
