# Marketing Documentation Design

Date: 2026-09-02
Status: Implemented locally and validated
Route: `/documentation/best-practices/marketing`

## Outcome

Publish a public, U.S.-wide nonprofit marketing and communications guide that
helps organizations reach a specific audience with one truthful message, one
appropriate invitation, and evidence they can support. Pair it with a
device-local 90-day campaign planner that turns those decisions into a
sustainable channel rhythm and reviewable next actions.

## Selected Approach

Three useful interactive directions were considered:

1. A post generator would feel immediate but could invent claims, flatten
   community voice, and overemphasize production before strategy.
2. A communications scorecard would be easy to complete but would imply a
   universal maturity standard that does not exist.
3. A campaign brief and 90-day rhythm builder preserves user judgment, exposes
   assumptions, and produces reusable inputs for human or AI-assisted drafting.

The third approach best matches the Coach House Accelerator and the existing
documentation tool contract. It generates structure and safeguards, not
unverified marketing copy or performance predictions.

## Audience

- People exploring a nonprofit idea and testing how the community describes the
  need.
- Forming organizations establishing source messages, permissions, and review
  roles.
- Operating nonprofits replacing reactive posting with a repeatable rhythm.
- Growing organizations coordinating channels, owners, measurement, and public
  risk.

The route remains public for anonymous, free, and paid users inside the shared
Coach House canvas and documentation rail.

## Learning Sequence

The guide adapts the current Coach House Accelerator communications work:

1. Identify the priority audience.
2. Separate what people need to be informed about, inspired by, and invited to
   do.
3. Name one main message and one useful action.
4. Map annual mission moments and select a focused 90-day period.
5. Choose only the channels the team can maintain.
6. Establish a realistic cadence, owners, review, and reuse system.
7. Use AI to adapt reviewed source material while retaining human verification.

The live curriculum in `docs/updates_edits.md` and communications assignment
migrations is the internal content authority for this phase.

## Article Contract

The page uses the shared `BestPracticeArticlePage` renderer and includes:

- A direct definition suitable for search and AI retrieval.
- Exploring, Forming, Operating, and Growing guidance.
- A fictional worked example showing reactive and reviewable plans.
- A seven-part communications framework.
- A checklist, common failures, evidence measures, visible review metadata,
  sources, disclaimer, Article JSON-LD, and breadcrumb JSON-LD.
- Clear distinctions among legal requirements, technical standards, platform
  rules, and recommended practice.

## Interactive Planner

The planner accepts:

- Organization name and stage.
- Campaign objective and optional campaign name.
- Primary audience, main message, supporting proof, and primary invitation.
- Monthly cadence for email, website, social media, partner outreach, events,
  and earned media.
- Whether story permission, content review, and campaign-link conventions exist.

It calculates only visible arithmetic:

- Active channels are channels with a cadence above zero.
- Monthly outputs are the sum of user-entered channel cadences.
- Ninety-day outputs are monthly outputs multiplied by three.
- Weekly pace is ninety-day outputs divided by thirteen.

It produces an Inform, Inspire, Invite brief, stage and channel actions, and an
AI handoff prompt that tells a drafting system not to invent facts, quotes,
outcomes, permissions, dates, or legal conclusions. It does not predict reach,
engagement, conversion, or impact.

## Data And Export Boundary

- Browser local storage only; no account or network persistence.
- Reset requires confirmation.
- Example data is fictional and clearly named.
- CSV export includes source inputs, cadence, arithmetic, and actions.
- Formula-leading user input is neutralized in CSV cells.
- Copying the AI handoff prompt uses the browser clipboard and a polite status
  announcement.

## Source Policy

The source set includes Coach House Accelerator, CDC clear-communication
guidance, DOJ and W3C accessibility guidance, FTC email and endorsement
guidance, U.S. Copyright Office guidance, IRS political-activity guidance, and
Google Analytics campaign-link documentation. Each source card links to the
exact page and explains its use.

## Accessibility And Responsive Behavior

- Native headings, fieldsets, labels, table, links, and buttons.
- Keyboard-operable controls and visible focus states.
- Minimum 44-pixel primary controls and sixteen-pixel form text on mobile.
- Locale-aware, tabular number formatting.
- Text labels accompany every calculated state.
- Wide cadence tables scroll inside their container.
- Empty fields produce explicit next actions instead of broken output.
- Polite announcements report example, reset, copy, and download actions.

## Acceptance

- Navigation marks Marketing live and exposes the canonical route.
- Article has four stages, seven framework steps, at least nine checklist items,
  six common failures, six measures, and nine named sources.
- Sanitization rejects invalid stages, objectives, excessive cadence, and
  oversized text.
- Summary arithmetic covers empty, single-channel, and multi-channel plans.
- Generated actions respond to stage, active channels, missing source inputs,
  and governance checks.
- AI prompt contains user inputs and explicit anti-invention safeguards.
- CSV contains brief, cadence, actions, and formula-injection protection.
- Route remains composition-only with canonical metadata.
- Focused tests, browser interaction, desktop/mobile review, and the complete
  repository quality gate pass before handoff.
