# Fundraising Documentation Design

Date: 2026-09-02
Status: Implemented locally and validated
Route: `/documentation/best-practices/fundraising`

## Outcome

Publish a public, U.S.-wide nonprofit fundraising guide that connects strategy,
relationships, ethical practice, gift handling, and stewardship. Pair the guide
with a device-local planner that turns an approved funding need into an explicit
channel plan and next-action sequence without predicting revenue.

## Audience

- People exploring whether to start a nonprofit or sponsored project.
- Forming organizations building their first fundraising systems.
- Operating nonprofits moving from founder memory to shared records.
- Growing organizations managing portfolios, restrictions, reporting, and
  revenue concentration.

The route remains public for anonymous, free, and paid users. It uses the shared
Coach House canvas and contextual documentation rail.

## Learning Sequence

The guide adapts the current Coach House Accelerator fundraising sequence:

1. Fundraising mindset.
2. Audience segmentation.
3. Relationship or “treasure” mapping.
4. Donor journey and next action.
5. Channel inventory.
6. Case for support and the ask.
7. Tools, records, acknowledgment, and stewardship.

The repository contains placeholder PDFs but no substantive accelerator PDF for
this subject. The live curriculum source in `docs/updates_edits.md` and the
fundraising assignment migrations is the internal content authority for this
phase.

## Article Contract

The page uses the shared `BestPracticeArticlePage` renderer and includes:

- A direct answer suitable for search and AI retrieval.
- A complete definition and critical distinctions.
- Exploring, Forming, Operating, and Growing guidance.
- A fictional worked example with weak and reviewable versions.
- A seven-part operating framework.
- A checklist, common failures, and evidence measures.
- Visible review metadata, sources, disclaimer, Article JSON-LD, and breadcrumb
  JSON-LD.
- Previous and next guide relationships.

Assertions distinguish law, funder terms, professional ethical standards, and
recommended practice. Content never presents a prospect, proposal, or planning
amount as committed revenue.

## Interactive Planner

The planner accepts:

- Organization name and stage.
- Planning period.
- Total funding goal and committed funds.
- User-entered planning amounts for individuals, foundations, government,
  corporate support, and events or peer campaigns.
- Whether a reviewed case for support and gift-acknowledgment system exist.

It calculates only visible arithmetic:

- Funding need = total goal minus committed funds, floored at zero.
- Planned total = sum of user-entered channel amounts.
- Remaining gap or amount planned above the current need.
- Monthly planning pace = funding need divided by the selected period.
- Each channel’s share of the fundraising need.

The tool generates actions from explicit stage, channel, and readiness rules.
It does not assign probability, score funders, recommend “ideal” percentages,
or forecast revenue.

## Data And Export Boundary

- Browser local storage only; no account or network persistence.
- Reset requires confirmation.
- Example data is fictional and clearly named.
- CSV export contains plan assumptions, channel amounts, and actions.
- CSV cells neutralize formula-leading user input.
- The UI and export state that calculations are planning assumptions.

## Source Policy

The public source set includes:

- Coach House Accelerator for the internal learning sequence.
- IRS for contribution substantiation, disclosure, and solicitation guidance.
- Grants.gov and SAM.gov for federal grant lifecycle and registration.
- Association of Fundraising Professionals for professional ethics.
- National Council of Nonprofits for practical ethical fundraising and board
  responsibility.

Every source card names the publisher, links to the exact page, explains its use,
and appears beside a visible review date.

## Accessibility And Responsive Behavior

- Native headings, fieldsets, labels, table, links, and buttons.
- Keyboard-operable controls and visible focus states.
- Minimum 44-pixel primary controls on mobile.
- Sixteen-pixel form text to avoid mobile browser zoom.
- Tabular numerals and locale-aware currency and percentage formatting.
- Text status accompanies every numeric or visual state.
- Wide funding tables scroll inside their container on narrow screens.
- Polite announcements report example, reset, and download actions.

## Acceptance

- Navigation marks Fundraising live and exposes its canonical route.
- Article has four stages, seven framework steps, at least nine checklist items,
  six common failures, six measures, and eight named sources.
- Planner math covers balanced, remaining-gap, and overplanned states.
- Sanitization rejects invalid stages, periods, negative money, and excessive
  values.
- Generated actions respond to stage, selected channels, and readiness.
- CSV contains summary, mix, actions, and formula-injection protection.
- Route stays composition-only and exposes canonical metadata.
- Full repository quality gate, browser interaction, desktop, and mobile review
  pass before handoff.
