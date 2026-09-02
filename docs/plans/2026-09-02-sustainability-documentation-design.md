# Sustainability Documentation Design

Date: 2026-09-02
Status: Implemented locally and validated
Route: `/documentation/best-practices/sustainability`

## Outcome

Publish a public, U.S.-wide guide that helps nonprofit teams sustain mission
benefits by aligning strategy, people, flexible funding, systems, partnerships,
learning, adaptation, and continuity. Pair the guide with a device-local
scenario planner that turns assumptions into a reviewable decision.

## Selected Approach

Three directions were considered:

1. A sustainability score. This would imply a universal standard and compress
   different missions, risks, funding restrictions, and operating models into
   an unsupported rating.
2. A financial runway calculator. This is useful but too narrow: programs can
   fail because of capacity, leadership, systems, relevance, or continuity even
   when a cash projection appears positive.
3. A mission-capacity scenario planner. This combines transparent financial
   arithmetic with staff capacity, essential commitments, dependencies,
   governance safeguards, assumptions, and decision triggers.

The third direction is selected. It reflects Coach House multi-year budgeting
material and research that treats sustainability as broader than funding.

## Interactive Planner

The sandbox will:

- accept an organization, initiative, stage, direction, and planning horizon;
- keep unrestricted cash and expected unrestricted revenue separate from
  restricted funds;
- calculate monthly planned cost, horizon cost, projected flexible balance,
  starting cash runway, and weekly capacity margin or gap;
- document the mission priority, essential commitments, financial assumptions,
  people dependencies, systems and partner dependencies, adaptation triggers,
  owner, and review rhythm;
- render a live continuity chain from mission promise to decision trigger;
- generate stage-specific and scenario-specific actions without a score;
- save only in browser local storage;
- load a fictional example, reset with confirmation, copy a guarded review
  prompt, and download a formula-safe CSV.

The arithmetic is a simplified planning scenario. It is not a cash-flow
forecast, reserve recommendation, solvency opinion, financial statement,
valuation, audit, legal conclusion, or assurance that a program will continue.

## Accessibility And Responsive Behavior

- Persistent labels and descriptions accompany every input.
- Direction choices use native radio semantics and safeguards use checkboxes.
- Currency and hour inputs support keyboard and mobile numeric entry.
- The continuity chain reads in source order without relying on arrows or color.
- Calculated results have text equivalents and polite updates.

## Verification

- Acceptance coverage for article completeness, sanitization, scenario math,
  action generation, guarded prompt content, and CSV formula safety.
- Route, metadata, navigation, and composition-contract coverage.
- Anonymous desktop and mobile browser QA for editing, example/reset,
  persistence, copy, download, keyboard access, overflow, and dark mode.
- Full `pnpm check:quality`, followed by runlog and Graphify updates.
