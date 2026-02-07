# Accelerator Readiness Criteria + Journey System (V1)
Status: active  
Owner: Caleb + Codex  
Last updated: 2026-02-07

---

## Purpose
- Define explicit, auditable rules for `Fundable` and `Verified`.
- Tie completion to real artifacts (documents, modules, roadmap, programs).
- Map the end-to-end user journey and identify optimization gaps.
- Establish a V1 gamification/flywheel model that improves activation and retention.

## Core Principle
- `Fundable` and `Verified` are evidence states, not visual-only badges.
- Every state must be derived from persisted data already in platform surfaces.
- No hidden/manual override for normal users; admin override is explicit + logged.

## V1 User Journey Map (Founder/Admin)
1. Account + onboarding completed.
2. Organization profile created (name, contact, location, mission baseline).
3. Formation lessons completed (`naming-your-nfp`, `nfp-registration`, `filing-1023`).
4. Strategic roadmap sections drafted with non-empty content.
5. Core legal/ops documents uploaded.
6. Program budget + funding goal defined.
7. Coaching sessions used to close blockers.
8. Public/org-facing outputs ready (roadmap quality + docs + program clarity).
9. `Fundable` reached (criteria below).
10. `Verified` reached (criteria below).

## Data Sources For Readiness
- Organization profile: `organizations.profile` (identity, mission, documents, roadmap sections).
- Module completion: `module_progress` and `assignment_submissions`.
- Program funding readiness: `programs.goal_cents` + wizard snapshots.
- Formation/legal status: `organizations.profile.formationStatus`.
- Team readiness: `organizations.profile.org_people`.

## Evidence Matrix (Operational)
| Criterion | State | Evidence source | Pass condition | UX destination |
|---|---|---|---|---|
| Formation lesson 1 complete | Fundable + Verified | `module_progress` | `naming-your-nfp` = `completed` | `/accelerator/class/formation/module/1` |
| Formation lesson 2 complete | Fundable + Verified | `module_progress` | `nfp-registration` = `completed` | `/accelerator/class/formation/module/2` |
| Formation lesson 3 complete | Fundable + Verified | `module_progress` | `filing-1023` = `completed` | `/accelerator/class/formation/module/3` |
| Program funding target | Fundable + Verified | `programs.goal_cents` | At least one program `goal_cents > 0` | `/my-organization?view=editor&tab=programs` |
| Core roadmap drafted | Fundable + Verified | `organizations.profile.roadmap.sections` + homework state | `origin_story`, `need`, `mission_vision_values`, `theory_of_change`, `program` all non-empty or complete | `/accelerator/roadmap/:slug` |
| Verification letter uploaded | Fundable (optional path), Verified (mandatory) | `organizations.profile.documents` | `verificationLetter` present with metadata | `/my-organization/documents` |
| Formation legal state | Verified | `organizations.profile.formationStatus` | `approved` (or admin-reviewed equivalent) | `/my-organization?view=editor&tab=company` |
| Team minimum viable | Fundable | `organizations.profile.org_people` | `>= 1` person | `/my-organization?view=editor&tab=people` |
| Advanced execution signal | Verified | `module_progress` | `>= 1` non-formation module in progress/completed | `/accelerator` |

## Deterministic Scoring Contract
- Score updates only from persisted data; never from ephemeral UI state.
- Every missing criterion must map to one explicit CTA destination.
- If all Fundable hard requirements pass and score threshold passes, state becomes `Fundable`.
- If all Verified mandatory requirements pass and score threshold passes, state becomes `Verified`.
- Admin override is allowed only through explicit audit action and must be logged.

## Proposed V1 Criteria

### Fundable (target threshold: 70 points + hard requirements)
Hard requirements:
- Formation lessons complete:
  - `naming-your-nfp`
  - `nfp-registration`
  - `filing-1023`
- At least 1 program with `goal_cents > 0`.
- At least 1 legal document uploaded:
  - `verificationLetter` OR `articlesOfIncorporation`

Point model (100 max):
- Organization profile completeness: 20
- Roadmap core sections drafted (origin story, need, mission/vision/values, theory of change, program): 30
- Formation lessons completion: 25
- Program + budget clarity (program exists + funding goal set): 15
- Team minimum viability (>= 1 person): 10

### Verified (target threshold: 90 points + mandatory artifacts)
Mandatory artifacts:
- `verificationLetter` uploaded.
- `formationStatus` is `approved` OR admin-reviewed equivalent.
- All three formation lessons complete.
- Core roadmap sections complete (same five as above).
- Program funding target present.

Point model (100 max):
- All Fundable criteria satisfied: 70
- Document pack depth (`verificationLetter`, `bylaws`, `stateRegistration`, `goodStandingCertificate`, `w9`): 20
- Sustained execution proof (>= 1 in-progress or completed advanced module beyond formation): 10

## Badge Semantics
- `Not started`: below Fundable threshold.
- `Fundable`: meets all Fundable hard requirements + threshold.
- `Verified`: meets all Verified mandatory artifacts + threshold.
- If `Verified` is true, `Fundable` is implicitly true.

## UX Rules
- Show exactly which criteria are missing with direct CTA links:
  - missing docs -> `/my-organization/documents`
  - missing formation module -> module deep link
  - missing roadmap section -> section deep link
  - missing funding goal -> `/my-organization?view=editor&tab=programs`
- Never show “mystery percent”; always provide reason + next action.

## Journey Gap Analysis (Current -> Needed)
1. Public entry (`/home-canvas`, `/pricing`):
   - Gap: value proposition and tier consequences are still fragmented across cards.
   - Needed: one canonical plan comparison string for Free vs Accelerator Pro, reused in all surfaces.
2. Auth + onboarding:
   - Gap: setup completion state exists but journey handoff to first actionable accelerator task is not always explicit.
   - Needed: deterministic post-onboarding redirect to first incomplete formation step.
3. Accelerator home (`/accelerator`):
   - Gap: progression card alignment and ordering can drift if data shape changes.
   - Needed: one shared render contract for module + deliverable card anatomy and status positioning.
4. Organization operations (`/my-organization`):
   - Gap: readiness evidence and org editing still feel like separate workflows.
   - Needed: readiness checklist links should always deep-link into editor tabs and return safely.
5. Coaching + completion loop:
   - Gap: coaching usage helps progress but is weakly tied to criteria closure.
   - Needed: each completed coaching session should suggest 1-2 readiness criteria to close next.

## Connection Map (Dot Linking)
- Module completion -> updates `module_progress` -> recalculates readiness -> updates snapshot strip + right-rail copy.
- Roadmap content update -> updates `organizations.profile.roadmap.sections` -> recalculates readiness -> unlocks next checklist item.
- Program goal update -> updates `programs.goal_cents` -> recalculates readiness -> updates funding criterion status.
- Document upload -> updates `organizations.profile.documents` -> recalculates readiness -> can shift `Fundable`/`Verified`.
- Coaching booking -> records support action -> should bias next suggested criteria (future enhancement).

## Gamification + Flywheel (V1)
- Short loop:
  - complete module -> update readiness -> unlock clearer next action -> schedule coaching -> complete next module.
- Visible momentum:
  - show streak-like progress at lesson-group level (not raw card count).
- Flywheel:
  - better docs + roadmap quality -> higher readiness -> faster fundraising conversations -> more coaching touchpoints -> stronger completion.
- Guardrail:
  - do not gate navigation by lock state in accelerator cards; allow exploration, but keep readiness state evidence-based.

## Game-Theory Design Levers (V1-safe)
- Commitment device:
  - Require users to choose one “next milestone” from checklist; keep it pinned until resolved.
- Loss aversion framing:
  - Show “blocked funding opportunities” count when critical evidence is missing.
- Goal-gradient effect:
  - Emphasize distance-to-threshold (`Fundable` or `Verified`) with explicit “N criteria remaining.”
- Social proof without dark patterns:
  - Show anonymized benchmark ranges (“most orgs complete X before Y”) only when statistically valid.
- Exploration freedom:
  - Keep all modules navigable; progression state informs priority, not lockouts.

## Implementation Backlog (Next)
1. Add a deterministic readiness calculator utility (single source of truth).
2. Persist a computed readiness snapshot (for audit + analytics).
3. Replace static progress checkpoints in accelerator strip with computed criteria output.
4. Add missing-criteria checklist component with deep links.
5. Add acceptance tests for Fundable/Verified transitions.

## V1 Completion Checklist (Operational)
- Readiness criteria produce identical results server-side and in acceptance tests.
- Each missing criterion has an explicit deep link destination.
- Seeded demo account can reach both `Fundable` and `Verified` via deterministic fixture switches.
- Accelerator ordering is deterministic with Formation first, electives after core formation path.
- Launch docs (`organize.md`, launch active worklog, RUNLOG) stay in sync after each incremental pass.

## Open Decisions
- Whether `Verified` requires all doc types or just a reduced mandatory subset.
- Whether coaching usage should contribute score or only be informational.
