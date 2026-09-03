# Nonprofit Campaigns Documentation Design

## Objective

Publish a public, U.S.-wide Campaigns guide at `/documentation/tools/campaigns` that helps nonprofit teams turn one mission-aligned objective into a bounded, accessible, reviewable campaign. The guide must work without an account, remain useful across awareness, service-access, fundraising, advocacy, civic-participation, volunteer, event, and partnership campaigns, and keep legal, tax, accessibility, privacy, and channel-specific decisions with qualified people.

## Approaches considered

### 1. Decision-first campaign system — selected

Move through seven connected decisions: frame, listen, build, review, launch, respond, and learn. Users define the audience need and desired action before choosing channel roles, then connect claims, access, permissions, authority, capacity, response, and measurement to the same brief.

This approach applies across campaign types without duplicating the Marketing guide’s ongoing communications rhythm, the Social Media guide’s publishing workflow, or the Fundraising guide’s revenue strategy.

### 2. Channel-first content calendar

Rejected as the primary model because a calendar can make activity look complete while the audience, destination, evidence, permissions, owners, response capacity, or decision rule remain undefined.

### 3. Fundraising campaign generator

Rejected because Campaigns must also serve program access, public education, advocacy, civic participation, volunteers, events, and partnerships. Fundraising-specific goals, gifts, acknowledgments, restrictions, and stewardship remain in the Fundraising guide.

## Information architecture

The article uses the established documentation sequence:

1. Direct answer and definition.
2. Why campaign operations matter.
3. U.S.-wide legal, tax, channel, privacy, and accessibility boundaries.
4. Exploring, forming, operating, and growing guidance.
5. Fictional before-and-after campaign example.
6. Seven-part campaign system.
7. Practical checklist, common mistakes, and useful measures.
8. Visible source cards with publisher, direct link, and relevance.
9. Educational disclaimer and Legal/CRM navigation.

## Interactive model

The Campaign Brief Builder includes:

- Organization, campaign name, stage, campaign type, and working dates.
- Seventeen narrative areas for objective, audience, audience evidence, desired action, message, supporting evidence, offer or destination, channel roles, milestones, budget and capacity, owners and approvals, accessibility and language, consent and privacy, compliance review, response and escalation, measurement, and learning decision.
- Five human-review safeguards for claims, accessibility, consent/privacy, legal/tax/channel review, and delivery/response capacity.
- A live seven-step campaign chain, transparent drafted-area and safeguard counts, stage and missing-step actions, a one-page brief, guarded AI review prompt, and formula-safe CSV.

The tool does not calculate a readiness score. “Drafted” means the named working fields contain text; it does not establish accuracy, authority, permission, compliance, accessibility, capacity, or likely performance.

## Data flow and privacy

The client hook loads a versioned draft from `localStorage`, sanitizes all fields, and writes edits to the same browser. Example and reset actions replace the full draft. The CSV escapes spreadsheet-formula prefixes. The AI prompt instructs reviewers to preserve unknowns and not invent facts, quotes, permissions, laws, deadlines, audience findings, capacity, costs, or outcomes. It also tells users to remove personal and sensitive information before using another service.

No server action, authentication check, account entitlement, database write, content publication, channel connection, message delivery, audience upload, fundraising processing, or analytics integration is added.

## Visual and interaction design

Use the existing documentation canvas, rail, article typography, sandbox frame, shadcn controls, monochrome high-contrast surfaces, square editorial cards, and compact status bands. The seven-step chain provides the primary illustration and changes from Open to Drafted using text as well as surface contrast.

Preserve native form semantics, visible labels, 44-pixel mobile targets, 16-pixel mobile inputs, keyboard focus, polite live feedback, dark mode, long-text wrapping, and zero horizontal overflow. The campaign dates are working planning dates, not filing, notice, fundraising-registration, or legal deadlines.

## Source and content standard

Coach House Accelerator communications material supplies the audience, message, invitation, channel, 90-day focus, sustainable cadence, and human-review sequence. Current primary guidance supports clear public communication, political-campaign and lobbying boundaries, charitable solicitation and gift disclosures, email and text rules, endorsements, accessibility, privacy and security, and copyright.

The article distinguishes campaign categories instead of treating every public effort as an electoral campaign. It states that section 501(c)(3) organizations are prohibited from candidate campaign intervention, while lobbying and other advocacy require organization- and fact-specific review. State and local rules, other exempt classifications, sponsored projects, contracts, grants, platforms, and audience relationships may change the analysis.

## Verification

- Acceptance coverage for navigation, route metadata, article completeness, source links, campaign types, date handling, sanitization, pathway counts, actions, guarded prompt language, CSV safety, local storage, and anonymous access.
- Focused formatting, lint, structure, route, boundary, interaction, and acceptance checks.
- Anonymous Chromium QA on desktop light mode and mobile dark mode for editing, example/reset, dates, persistence, copy, download, responsive layout, focusable controls, overflow, and console errors.
- Full `PLAYWRIGHT_BASE_URL=http://localhost:3010 pnpm check:quality` before the local phase commit.
