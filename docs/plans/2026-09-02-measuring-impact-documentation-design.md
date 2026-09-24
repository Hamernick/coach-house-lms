# Measuring Impact Documentation Design

Date: 2026-09-02
Status: Implemented locally and validated
Route: `/documentation/best-practices/measuring-impact`

## Outcome

Publish a public, U.S.-wide guide that helps nonprofit teams define useful
outcomes, ask answerable evaluation questions, select proportionate evidence,
and decide how findings will change the work. Pair the guide with a device-local
measurement-plan builder that exposes the complete chain from decision to use.

## Selected Approach

Three directions were considered:

1. An impact dashboard. This would emphasize presentation before definitions,
   evidence quality, interpretation, and decision use are established.
2. A maturity or impact score. This would imply a universal standard and could
   turn incomplete self-reported inputs into an unsupported judgment.
3. A decision-led measurement plan. This starts with who will use the evidence
   and why, then connects one outcome, question, indicator, feasible method,
   collection rhythm, limitations, and action rule.

The third direction is selected. It follows current CDC guidance to focus an
evaluation around intended users and uses, gather credible evidence that fits
the question and context, and plan for findings to be acted on.

## Learning Model

The guide distinguishes implementation, outputs, outcomes, and longer-term
impact. It separates contribution from causal attribution, indicators from
survey questions, and data collection from learning. Quantitative and
qualitative evidence are treated as complementary methods with different
strengths and limits.

Guidance changes by stage:

- exploring: understand the context and test whether the proposed outcome is
  relevant to people affected;
- forming: define the program pathway, one priority question, and a feasible
  baseline or starting point;
- operating: monitor implementation and outcomes, interpret results with
  participants, and document adaptations;
- growing: preserve definitions and governance while testing variation across
  sites, groups, and delivery conditions.

## Interactive Measurement Plan

The public sandbox will:

- accept an organization, program, stage, and intended decision;
- capture one outcome, evaluation question, indicator, method, source,
  collection rhythm, owner, disaggregation plan, limitations, and action rule;
- calculate annual response volume and respondent hours from explicit inputs;
- render a live decision-to-use evidence chain;
- show drafted areas and missing safeguards without a quality score;
- generate stage-specific actions and a guarded human-review prompt;
- save only in browser local storage;
- load a clearly fictional example, reset with confirmation, and download a
  formula-safe CSV.

The tool will not establish attribution, validate methods, forecast outcomes,
certify evaluation quality, or replace participant, evaluator, privacy, legal,
or institutional review.

## Accessibility And Responsive Behavior

- Every control has a persistent label, description, and mobile-safe size.
- Decision choices use native radio semantics; safeguards use checkboxes.
- The evidence chain reads in source order and never relies on color or arrows.
- Desktop uses a horizontal chain inside a bounded scroller; mobile uses a
  vertical sequence.
- Calculations have text equivalents and updates use polite status messages.

## Verification

- Acceptance coverage for article completeness, sanitization, burden math,
  action generation, guarded prompt content, and CSV formula safety.
- Route, metadata, navigation, and composition-contract coverage.
- Anonymous desktop and mobile browser QA for editing, example/reset,
  persistence, copy, download, keyboard access, overflow, and dark mode.
- Full `pnpm check:quality`, followed by runlog and Graphify updates.
