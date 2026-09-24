# Nonprofit CRM Documentation Design

## Objective

Publish a public, U.S.-wide CRM guide at `/documentation/tools/crm` that helps nonprofit teams define why they keep relationship records, choose the minimum useful fields, govern collection and communication preferences, maintain data quality, limit access and sharing, and close records responsibly. The guide must work without an account or vendor connection and remain useful whether the current system is memory, paper, a spreadsheet, several disconnected tools, or a mature CRM.

## Approaches considered

### 1. Data stewardship plus relationship lifecycle — selected

Connect seven decisions: define, collect, permission, maintain, use, protect, and retire. Pair an organization-level operating brief with a field dictionary that records each field’s purpose, source, sensitivity, access, and retention review.

This model helps teams before and after vendor selection. It also prevents a CRM from becoming an unexamined contact warehouse or outreach scoreboard.

### 2. Outreach pipeline

Rejected as the primary model because pipelines describe follow-up but do not establish why information is collected, whether a communication channel is appropriate, who can access a record, how errors are corrected, or when data should be removed. Relationship stages remain a useful secondary practice.

### 3. Vendor-selection matrix

Rejected because products, prices, discounts, integrations, and eligibility change. Verified CRM products and offers belong in Marketplace, while this guide supplies the requirements a team should bring to that comparison.

## Information architecture

The article follows the established documentation sequence:

1. Direct answer and plain-language CRM definition.
2. Why constituent-data stewardship matters.
3. U.S.-wide privacy, communications, records, accessibility, security, and sector-specific boundaries.
4. Exploring, forming, operating, and growing guidance.
5. Fictional before-and-after CRM example.
6. Seven-part relationship-record lifecycle.
7. Practical checklist, common mistakes, and useful measures.
8. Visible source cards with publisher, direct link, and relevance.
9. Educational disclaimer and Campaigns/Marketplace navigation.

## Interactive model

The CRM Data Stewardship Planner includes:

- Organization, plan name, stage, primary relationship context, and review interval.
- Fifteen operating areas for purpose and decisions, people and accountability, record boundaries, collection and notice, communication preferences, identity and duplicates, relationship stages, access roles, data quality and correction, retention and deletion, integrations and exports, security and incidents, accessibility and language, reporting, and vendor or migration constraints.
- Up to eight field-dictionary entries with a generic field label, category, purpose, source, sensitivity, access role, and retention review. The planner tells users not to enter real names, contact details, case notes, health information, credentials, or other personal data.
- Five human-review safeguards for minimum necessity, notice and preferences, access and integrations, retention and incident handling, and applicable legal or sector review.
- A live seven-step lifecycle, transparent counts, stage and missing-area actions, a working operating brief, an accessible field table, guarded AI review prompt, and formula-safe CSV.

The tool does not calculate readiness, relationship value, donor potential, service eligibility, risk, consent, legal coverage, security, or vendor fit. “Defined” means the relevant working fields contain text; it is not approval or verification.

## Data flow and privacy

The client hook loads a versioned draft from `localStorage`, sanitizes every value, and writes edits to the same browser. Example and reset actions replace the full draft. Field identifiers are sanitized and the list is capped at eight entries. CSV export escapes spreadsheet-formula prefixes.

The guarded prompt tells AI reviewers not to invent people, consent, permissions, records, laws, retention periods, security controls, vendor capabilities, or results. It instructs the user to remove all personal and sensitive information before using another service.

No authentication check, entitlement check, server action, database write, CRM integration, contact import, message delivery, segmentation, scoring, automated decision, vendor recommendation, or publication is added.

## Visual and interaction design

Use the existing documentation canvas, contextual rail, article typography, sandbox frame, installed shadcn controls, restrained Geist surfaces, square editorial cards, compact status bands, and high-contrast light and dark themes. The lifecycle strip and field dictionary are the primary working illustrations.

Preserve native form and table semantics, visible labels, keyboard access, visible focus, 44-pixel mobile targets, 16-pixel mobile inputs, polite live feedback, long-text wrapping, horizontal containment for the complete table, and zero page-level overflow. Status uses text as well as surface contrast.

## Source and content standard

Coach House Accelerator fundraising exercises supply the existing-system inventory, relationship stages, next-action discipline, ownership, cadence, and tools-and-systems context. Current primary or authoritative sources support data inventory and minimization, privacy risk management, access control and authentication, incident preparation, exempt-organization records, email and text review, accessibility, state contacts, and conditional health or education-record duties.

The article states that requirements depend on the organization, data, people, promises, activity, channel, contract, funding, sector, and jurisdiction. It does not assume HIPAA, FERPA, federal privacy law, or a single state rule applies to every nonprofit.

## Verification

- Acceptance coverage for navigation, route metadata, article completeness, source links, contexts, field categories, sanitization, field limits, lifecycle counts, actions, guarded prompt language, CSV safety, local persistence, and anonymous access.
- Focused formatting, lint, structure, route, boundary, interaction, and acceptance checks.
- Anonymous Chromium QA on desktop light mode and mobile dark mode for example loading, add/edit/remove, field counts, safeguards, persistence, copy, download, responsive table containment, mobile input sizing, overflow, and console errors.
- Full `PLAYWRIGHT_BASE_URL=http://localhost:3010 pnpm check:quality` before the local phase commit.
