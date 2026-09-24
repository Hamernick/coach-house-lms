# Frameworks Documentation Design

Date: 2026-09-02
Status: Implemented locally and validated
Route: `/documentation/best-practices/frameworks`

## Outcome

Publish a public, U.S.-wide guide that helps nonprofit teams choose a framework
for the decision in front of them, understand how established frameworks relate,
and turn a change hypothesis into a reviewable program model. Pair the article
with a device-local workspace that recommends a starting framework, builds a
live logic model, exposes missing links and assumptions, and exports the work.

## Selected Approach

Three directions were considered:

1. A large template gallery. This offers breadth but encourages users to select
   a familiar label before defining the question they need to answer.
2. A maturity score. This appears decisive but would create an unsupported
   universal standard and could imply organizational readiness the tool cannot
   determine.
3. A question-led framework selector plus logic-model workspace. This teaches
   when to use each tool and provides one coherent applied workflow without
   presenting the output as validated evidence.

The third direction is selected. It is useful across nonprofit stages, aligns
with Coach House Theory of Change and Systems Thinking material, and connects
naturally to the next Measuring Impact guide.

## Learning Model

The article distinguishes five related jobs:

- systems map: understand conditions, actors, relationships, and constraints;
- theory of change: explain how and why a pathway should produce change;
- logic model: connect resources and activities to outputs and outcomes;
- responsibility map: clarify ownership, decisions, contributions, and notice;
- learning cycle: compare expectations with evidence and adapt deliberately.

The guide emphasizes that a framework is a working representation, not proof.
Teams should build it with people closest to the work, label assumptions, keep
outputs separate from outcomes, test causal links, and revise the model as the
program and context change.

## Interactive Workspace

The public sandbox will:

- accept an organization, program, stage, and primary planning question;
- recommend one starting framework with an explanation and next actions;
- collect the need, people, inputs, activities, outputs, near-term outcomes,
  intermediate outcomes, long-term contribution, assumptions, context, and
  evidence or learning question;
- render a live, responsive logic chain with explicit arrows and plain-language
  empty states;
- show a transparent drafted-area count rather than a score;
- generate stage-specific and missing-link actions;
- save only in browser local storage;
- load a clearly fictional example, reset with confirmation, copy a guarded
  review prompt, and download a formula-safe CSV.

The tool will not validate causality, forecast impact, certify readiness,
recommend funding, or treat a completed model as evidence.

## Content And Sources

The learning sequence uses Coach House Accelerator materials for Need Statement
alignment, If-Then-So That Theory of Change, Systems Thinking reflection,
assumptions, and piloting. External definitions and practices use primary or
institutional sources from CDC, AmeriCorps, USAID, the U.S. Department of State,
and the Minnesota Department of Health.

## Accessibility And Responsive Behavior

- Every field has a persistent label, useful description, length limit, and
  mobile-safe text size.
- Framework choices use native radio semantics and full-row hit targets.
- The logic chain reads in source order without relying on arrows or color.
- Desktop presents a horizontal model; narrow screens use a vertical sequence.
- All calculated state has a text equivalent and polite status updates.
- Tables and long exports stay inside bounded horizontal scrollers.

## Verification

- Unit-style acceptance coverage for article completeness, selection logic,
  sanitization, action generation, guarded prompt output, and CSV safety.
- Route, metadata, navigation, and composition-contract coverage.
- Anonymous desktop and mobile browser QA for editing, framework selection,
  live model rendering, example/reset, persistence, copy, download, keyboard
  access, overflow, console errors, and dark mode.
- Full `pnpm check:quality`, followed by the runlog and Graphify update.
