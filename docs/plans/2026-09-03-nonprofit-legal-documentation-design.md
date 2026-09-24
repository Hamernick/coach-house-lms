# Nonprofit Legal Documentation Design

## Objective

Publish a public, U.S.-wide Legal guide at `/documentation/tools/legal` that helps nonprofit leaders recognize a legal matter, protect people and records, organize facts and open questions, identify applicable authorities and jurisdictions, and prepare a useful referral to qualified counsel. The page must remain useful without an account, store its draft only on the user’s device, cite visible sources, and avoid presenting general information as legal advice.

## Approaches considered

### 1. Legal matter and referral brief — selected

Guide one real question through six steps: triage, stabilize, preserve, scope, refer, and decide. Users separate known facts from assumptions; identify affected people, locations, deadlines, governing documents, authority, conflicts, access and safety concerns, evidence, data boundaries, counsel needs, and follow-up. The result is a reviewable brief, missing-area actions, a guarded AI prompt, and formula-safe CSV.

This approach is specific enough to improve a professional handoff without deciding what the law requires or drafting a document that could be mistaken for approved legal work.

### 2. Contract and policy generator

Rejected because contracts and policies depend on state law, organizational authority, facts, counterparties, regulated activities, funding terms, insurance, and qualified review. A generic document could create false confidence or be adopted without the necessary process.

### 3. Comprehensive legal decision tree

Rejected because no static nationwide tree can reliably resolve the interaction of federal, state, Tribal, territorial, local, tax, employment, licensing, privacy, safety, property, and sector-specific rules. The page will teach issue spotting and referral, not simulate counsel.

## Information architecture

The article uses the established documentation sequence:

1. Direct answer and definition.
2. Why legal operations matter.
3. U.S.-wide limitations, urgent-safety boundary, and jurisdiction note.
4. Exploring, forming, operating, and growing guidance.
5. Fictional before-and-after referral example.
6. Seven-part matter-management framework.
7. Practical checklist, common mistakes, and useful process measures.
8. Visible source cards with publisher, link, and relevance.
9. Educational disclaimer and previous/next navigation.

The guide covers recurring matter categories without implying that the list is complete: formation and governance; tax-exempt status and activities; fundraising; people and work; contracts and partnerships; programs, licensing, safety, and safeguarding; accessibility and civil rights; privacy and cybersecurity; intellectual property; property, facilities, insurance, and risk; disputes and government inquiries; and merger, dissolution, transfer, or charitable assets.

## Interactive model

The Legal Matter and Referral Brief Builder contains:

- Organization name, working matter title, nonprofit stage, matter category, and urgency.
- Fourteen narrative areas covering the decision question, known facts, assumptions and unknowns, affected people, jurisdictions and locations, timeline and deadlines, governing source documents, prior actions and communications, authority and conflicts, safety and access, evidence preservation, confidentiality and data boundaries, counsel referral, and decision follow-up.
- Four human-review confirmations covering urgent safety and reporting, authority and conflicts, current jurisdiction and source review, and qualified attorney review before consequential action.
- A live six-step pathway, concise matter brief, stage and missing-area actions, guarded AI review prompt, and formula-safe CSV.

Urgency is descriptive. Selecting “Immediate safety or active incident” displays a prominent direction to use emergency, safeguarding, incident-response, insurance, regulator, and qualified legal channels as appropriate. It never claims to identify a mandatory report, notice period, filing deadline, privilege, legal hold, or emergency response.

## Data flow and privacy

The client hook loads a versioned draft from `localStorage`, sanitizes every value, and writes subsequent edits back to the same device. Example and reset actions replace the full draft. CSV generation escapes spreadsheet formulas. Clipboard copy includes only the current draft and tells users to remove names, contact details, health information, identity data, participant or worker records, investigation details, credentials, protected reports, and attorney communications before using another service.

The tool does not establish attorney-client privilege or confidentiality. No server action, authentication check, database write, account entitlement, legal-service referral, document upload, or third-party integration is added.

## Visual and interaction design

Use the existing documentation canvas, rail, article typography, sandbox frame, shadcn controls, monochrome high-contrast surfaces, compact status summaries, and square-edged editorial cards. Preserve visible labels, native form semantics, 44-pixel mobile targets, 16-pixel mobile inputs, keyboard focus, polite live feedback, dark mode, and no horizontal overflow.

The matter brief distinguishes facts, unknowns, people, jurisdiction, timing, authority, evidence, and referral. The six-step pathway changes from Open to Drafted only when its working fields contain text. Copy states that a filled field is not a finding, approval, legal conclusion, or completed review.

## Source and content standard

Coach House Accelerator governance, board, operating, financial, and organizational-document material supplies the learning sequence. Current IRS material supports organizing documents, governance, exempt-purpose, records, disclosure, and state-resource boundaries. NASCO provides the state-charity regulator directory. DOJ supports disability-access issue spotting. FTC supports security and breach-response planning. The U.S. Copyright Office and USPTO support intellectual-property issue spotting. eCFR supports federal-award control context. The American Bar Association supplies state and local bar referral directories. National Council of Nonprofits resources provide sector-specific governance and records context.

Every consequential statement remains qualified by organization, legal form, exemption, activity, people, funding, property, data, contract, jurisdiction, and current source review. The page will not invent universal policies, deadlines, retention periods, voting rules, board duties, reporting duties, privilege rules, liability conclusions, contract terms, or attorney recommendations.

## Verification

- Acceptance coverage for navigation, route metadata, article completeness, source links, category and urgency handling, sanitization, summary counts, actions, guarded prompt language, CSV safety, local storage, and anonymous access.
- Focused formatting, lint, structure, route, boundary, interaction, and acceptance checks.
- Anonymous Chromium QA on desktop light mode and mobile dark mode for editing, urgent guidance, example/reset, persistence, copy, download, responsive layout, focusable controls, overflow, and console errors.
- Full `PLAYWRIGHT_BASE_URL=http://localhost:3010 pnpm check:quality` before the local phase commit.
