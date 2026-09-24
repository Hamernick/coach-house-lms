# Nonprofit HR documentation design

## Decision

Publish a public U.S.-wide HR guide at `/documentation/tools/hr` with a device-local Role and People Practices Builder. The page will teach a nonprofit how to define one role and the system around it without deciding worker classification, drafting employment policies, or certifying legal compliance.

## Approaches considered

1. **Single-role lifecycle brief — selected.** Connect mission need, essential work, relationship review, full cost, recruitment, selection, onboarding, supervision, feedback, safety, records, and transition. This is concrete enough to use and narrow enough to review responsibly.
2. **Policy-library generator.** Rejected for this phase because U.S. federal, state, Tribal, territorial, and local rules vary, and generic generated policies could be mistaken for approved legal documents.
3. **Multi-role workforce portfolio.** Deferred because staffing scenarios, headcount, compensation bands, and organization charts need a separate financial and governance model.

## Learning architecture

The article follows the existing documentation contract: a direct answer, definition, why it matters, stage-specific guidance, fictional worked example, seven-part framework, implementation checklist, common mistakes, useful measures, primary sources, and educational limitation. It distinguishes employees, volunteers, independent contractors, board members, interns or fellows, and mixed teams as relationships requiring review—not labels selected by convenience.

The guide will use Coach House Accelerator prompts about program participants, staff, volunteers, trainers, qualifications, direct and indirect costs, leadership capacity, and succession. Current primary references will include the U.S. Department of Labor, Internal Revenue Service, Equal Employment Opportunity Commission, Occupational Safety and Health Administration, U.S. Citizenship and Immigration Services, and federal links to state labor offices.

## Interactive builder

The builder stores one versioned draft in browser local storage. Users choose an organization stage, working relationship under review, and 30-, 60-, 90-, or 180-day review period. They draft the role purpose, outcomes, essential functions, qualifications, schedule and location, compensation and full-cost assumptions, recruitment and selection process, onboarding and training, supervision and feedback, access and accommodations, safety and reporting, records boundary, owner and backup, and transition plan.

Four confirmations cover classification and compensation review, fair and accessible process review, safety and reporting review, and records and authorization review. The result shows only descriptive completion counts, a six-step lifecycle, missing-area actions, a readable role brief, a guarded AI review prompt, and formula-safe CSV. It never recommends a classification, pay amount, candidate, employment decision, exemption, policy, accommodation outcome, investigation result, or legal conclusion.

## Interaction and accessibility

The builder uses existing shadcn inputs, selects, checkboxes, and buttons. All inputs have native labels, mobile controls are at least 44 pixels high, focus remains visible, destructive reset requires confirmation, status changes use a polite live region, and the layout has no global horizontal overflow. Empty and partial drafts remain useful. The page supports light, dark, mobile, laptop, and wide layouts.

## Testing

Acceptance coverage will verify public navigation, article completeness, primary-source links, sanitization, summary arithmetic, stage and missing-area actions, guarded prompt language, CSV formula protection, route metadata, and exports. Browser QA will cover anonymous access, example loading, editing, lifecycle updates, persistence, copying, downloading, responsive layout, theme behavior, overflow, and console errors. The final implementation must pass the repository’s complete `pnpm check:quality` gate.
