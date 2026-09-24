# Networking Documentation Design

Date: 2026-09-02
Status: Implementation plan
Route: `/documentation/tools/networking`

## Outcome

Publish a public, U.S.-wide guide that helps nonprofit leaders build a useful,
reciprocal relationship system around a defined mission need. Pair the article
with a device-local Relationship Map Builder that turns a networking purpose,
community accountability, relationship roles, reciprocal value, and specific
follow-up into a reviewable working brief.

The page must help anonymous, free, paid, and staff users without requiring an
account. It must not expose personal contact data, contact anyone, sync a CRM,
imply endorsement, rank people, or treat a large contact list as evidence of
trust or community legitimacy.

## Editorial contract

The article will:

- define networking as intentional relationship building, listening, exchange,
  follow-through, and learning in service of a public purpose;
- distinguish a contact, relationship, referral, partnership, coalition,
  fundraising conversation, and advocacy contact;
- organize guidance for Exploring, Forming, Operating, and Growing stages;
- center people affected by the issue before institutional influence;
- show a seven-part loop from purpose through review;
- include a clearly fictional worked example;
- explain common failures, useful evidence, and limitations;
- link every material external reference visibly;
- use answer-first headings, plain language, explicit dates, and structured data
  already provided by the documentation article shell.

## Interactive contract

The Relationship Map Builder will store one versioned draft in browser local
storage. It will include:

- organization, initiative, stage, objective, and 4-, 8-, or 12-week review
  period;
- one networking purpose, community accountability statement, existing assets,
  gaps, invitation, follow-up rhythm, access plan, data boundary, owner, and
  escalation path;
- up to eight organization- or role-level relationship records;
- real functional categories such as community, peer nonprofit, public agency,
  funder, business or professional, and advocate or media;
- engagement modes of Listen, Learn, Exchange, Coordinate, and Collaborate;
- reciprocal fields for what the relationship can help the team understand or
  do, what the nonprofit can responsibly offer, and the next step;
- four human-review safeguards for community voice, consent and data,
  accessibility, and authority or conflicts;
- a live relationship pathway, category coverage, next-action list, stage and
  missing-brief actions, example/reset, guarded AI review prompt, and
  formula-safe CSV.

All counts are descriptive. They cannot establish relationship quality, trust,
representation, influence, power, equity, consent, readiness, access,
endorsement, or likely outcomes.

## Visual direction

Use the existing documentation rail and editorial article width. The sandbox
should resemble a quiet working instrument:

- a compact input header with device-storage status;
- bordered, neutral form sections with 44-pixel mobile controls;
- a responsive relationship pathway organized by engagement mode;
- a central purpose block followed by relationship cards with category, value,
  next step, owner, and review timing;
- a table as the complete accessible representation of mapped relationships;
- no decorative gradients, invented scores, avatars, fake profiles, or fake
  network activity;
- strong light, dark, keyboard, and no-horizontal-overflow behavior.

## Evidence base

Use Coach House Accelerator stakeholder, relationship, audience, fundraising,
and partnership prompts as the internal sequence. Supplement it with current or
authoritative ATSDR community-engagement principles and playbook material,
University of Kansas Community Tool Box stakeholder and relationship guidance,
FTC data-minimization guidance, DOJ effective-communication guidance, IRS
lobbying and political-campaign rules, and National Council of Nonprofits
advocacy guidance.

## Verification

- acceptance tests for article completeness, sources, navigation, sanitization,
  bounded records, descriptive calculations, stage actions, prompt constraints,
  CSV injection defense, and route metadata;
- anonymous browser QA in desktop light and mobile dark modes;
- add, edit, remove, example, reset, persistence, copy, download, accessibility,
  console-error, and overflow checks;
- full `pnpm check:quality` against the exact worktree server;
- current monthly runlog and `graphify update .` before the local commit.
