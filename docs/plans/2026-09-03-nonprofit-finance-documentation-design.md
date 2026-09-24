# Nonprofit Finance Documentation Design

## Objective

Publish a public, U.S.-wide Finance guide at `/documentation/tools/finance` that helps nonprofit leaders connect mission commitments, a board-reviewed operating budget, cash timing, funding restrictions, bookkeeping, internal controls, reporting, and reforecast decisions. The page must remain useful without an account, store its draft only on the user’s device, cite visible sources, and avoid presenting a planning estimate as accounting, legal, tax, grant, audit, or solvency advice.

## Approaches considered

### 1. Operating budget and controls rhythm — selected

Combine a focused cash-plan sandbox with a six-step operating cycle: plan, approve, record, reconcile, report, and reforecast. Users enter unrestricted and restricted opening cash, inflows, and outflows separately; describe full-cost assumptions and operating controls; select human-review safeguards; and receive transparent arithmetic, a working funds view, missing-plan actions, a guarded AI review prompt, and CSV export.

This is the best fit because it teaches the connection between planning and financial operations without pretending to replace a ledger, accounting system, financial statements, or professional review.

### 2. Full bookkeeping simulator

Model a chart of accounts, journal entries, classes, funds, and financial statements. This would be more interactive, but it would imply accounting-system completeness, require organization-specific accounting choices, and duplicate the existing Finance product surface. It is too broad and risky for a public general-knowledge page.

### 3. Finance policy generator

Generate ready-to-adopt purchasing, reimbursement, banking, reserve, and records policies. This could appear immediately useful, but policy terms depend on organization size, authority, state law, funder terms, banking arrangements, staffing, and professional review. A generic generator could create false confidence.

## Information architecture

The article uses the established documentation sequence:

1. Direct answer and definition.
2. Why financial management matters.
3. U.S.-wide limitations and jurisdiction note.
4. Exploring, forming, operating, and growing guidance.
5. Fictional before-and-after example.
6. Seven-part financial operating framework.
7. Practical checklist, common mistakes, and useful measures.
8. Visible source cards with publisher, link, and relevance.
9. Educational disclaimer and previous/next navigation.

The interactive sandbox sits after the article’s foundational explanation. It is subordinate to the teaching content and clearly labeled as a working draft.

## Interactive model

The Operating Finance Plan Builder contains:

- Organization name, stage, and 3-, 6-, 12-, or 18-month period.
- Six cash-planning inputs: beginning unrestricted cash, beginning restricted cash, planned unrestricted inflows, planned restricted inflows, planned unrestricted outflows, and planned restricted outflows.
- Fourteen narrative areas covering mission commitments, full cost, revenue evidence, restrictions, cash timing, budget ownership, purchase approval, payment and reimbursement, bank access and reconciliation, payroll and tax handoff, bookkeeping alignment, reporting, records, and variance triggers.
- Four review safeguards covering approved authority, restrictions and awards, accounting/payroll/tax, and independent reconciliation/report review.
- A live plan cycle, funds view, stage and missing-plan actions, guarded AI review prompt, and formula-safe CSV.

All arithmetic is descriptive. Restricted resources remain separate. The tool does not label a reserve target, determine liquidity or solvency, test allowability, certify controls, produce financial statements, or approve a transaction.

## Calculations

For each resource class:

- Projected ending cash = beginning cash + planned inflows − planned outflows.
- Average monthly outflow = planned outflows ÷ period months.
- Unrestricted planning coverage = projected ending unrestricted cash ÷ average monthly unrestricted outflow when both values are positive.

The interface labels negative ending balances as a planning gap, not a prediction or finding. Coverage is explicitly not reserve adequacy or a going-concern conclusion.

## Data flow and privacy

The client hook loads a versioned draft from `localStorage`, sanitizes every value, and writes subsequent edits back to the same device. Example and reset actions replace the full draft. CSV generation escapes spreadsheet formulas. Clipboard copy includes only the current draft and tells users to remove confidential, banking, payroll, donor, grant, vendor, participant, and personally identifying information before using another service.

No server action, authentication check, database write, account entitlement, bank connection, or third-party financial integration is added.

## Visual and interaction design

Use the existing documentation canvas, rail, article typography, sandbox frame, shadcn controls, monochrome high-contrast surfaces, compact tabular figures, and square-edged editorial cards. Preserve visible labels, native form semantics, 44-pixel mobile targets, 16-pixel mobile input text, keyboard focus, polite live feedback, dark mode, and no horizontal overflow.

The funds view uses a two-column unrestricted/restricted comparison rather than a chart. The six-step cycle behaves like documentation: each step changes from Open to Drafted only when its required fields contain text, while copy explains that completion is not approval.

## Source and content standard

Coach House Accelerator budgeting material supplies the learning sequence: translate program work into full cost, connect program and organization budgets, document assumptions, align the budget with the chart of accounts, and review reports with a bookkeeper, accountant, and board. Current IRS material supports records, annual-return, and payroll boundaries. Current eCFR provisions support federal-award financial management, controls, and retention. National Council of Nonprofits resources support budget, control, board-literacy, and reserve context.

Every consequential statement remains qualified by organization, activity, funding, jurisdiction, and current source review. No universal reserve ratio, control structure, accounting method, cost allocation, or approval threshold is invented.

## Verification

- Unit-style acceptance coverage for navigation, route metadata, article completeness, sanitization, calculations, actions, guarded prompt, CSV safety, local storage, and anonymous access.
- Focused lint, formatting, structure, route, boundary, and interaction checks.
- Anonymous Chromium QA on desktop light mode and mobile dark mode for editing, example/reset, persistence, copy, download, responsive layout, focusable controls, and console errors.
- Full `PLAYWRIGHT_BASE_URL=http://localhost:3010 pnpm check:quality` before the local phase commit.
