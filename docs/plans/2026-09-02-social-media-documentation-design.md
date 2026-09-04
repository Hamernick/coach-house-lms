# Social Media Documentation Design

Date: 2026-09-02

## Decision

Publish `/documentation/tools/social-media` as a public, U.S.-wide learning guide and device-local Social Media Brief & Content Lab. The page will teach a durable nonprofit publishing system rather than prescribe a universal posting frequency or imitate one platform. It will reuse the documentation article, sandbox, rail, metadata, persistence, export, and acceptance patterns already established on the branch.

## Reader outcome

A nonprofit founder, staff member, volunteer, or communications lead should be able to:

1. choose one real communication objective and audience;
2. assign a clear role and maintainable weekly cadence to each selected channel;
3. connect one sourced message to an appropriate invitation and working destination;
4. draft an accessible post with visual guidance, alternative text, captions or transcript planning, and descriptive link text;
5. identify permission, claim, disclosure, approval, response, and escalation work before publication;
6. export a reviewable brief without sending information to Coach House or a social platform.

## Information architecture

The server-rendered article will include a direct definition, why the work matters, guidance for Exploring, Forming, Operating, and Growing organizations, a fictional example, a seven-part operating framework, checklist, common mistakes, useful evidence, limitations, visible review date, and primary sources. The page will remain indexable without client JavaScript.

The interactive section will appear after stage guidance and before the worked example. It will include:

- campaign identity, stage, objective, duration, audience, action, and destination;
- source message, evidence or limitation, voice notes, story or permission context, draft copy, visual direction, alternative text, captions or transcript plan, and descriptive link text;
- real channel choices with user-set weekly output counts;
- story permission, claim verification, accessibility review, and approval or escalation confirmations;
- a generic live preview labeled as a planning preview, never a platform clone;
- transparent counts for active channels, weekly outputs, campaign outputs, drafted areas, and selected safeguards;
- a validated UTM link builder for HTTP and HTTPS destinations only;
- stage-specific and missing-information actions;
- example, reset, copy, and formula-safe CSV export controls.

## Data and safety boundaries

The draft uses versioned TypeScript data and browser `localStorage`. Inputs are length- and range-bounded on load. No authentication, subscription, API key, database write, upload, post scheduling, account connection, or automatic publication is required. The tool does not approve content, verify rights or consent, determine accessibility or legal compliance, predict performance, or recommend a universal channel mix.

Tracked links preserve a valid destination and add lowercase `utm_source`, `utm_medium=social`, and `utm_campaign` parameters. Non-HTTP schemes and malformed destinations produce an explicit inline state instead of a link. CSV cells that begin with spreadsheet formula characters are escaped. The AI handoff instructs a model not to invent facts, outcomes, quotes, dates, links, permissions, legal status, platform rules, capacity, or disclosures and to mark missing material for human review.

## Source approach

Coach House Accelerator materials provide audience, annual rhythm, 90-day focus, sustainable cadence, and human-reviewed AI context. Current primary references cover IRS political campaign limits for section 501(c)(3) organizations, FTC endorsements and disclosures, W3C accessibility principles, U.S. Department of Justice effective communication, platform-native alternative text and caption controls, privacy and data minimization, and copyright basics. Platform instructions are presented as current examples with visible source dates, not permanent rules.

## Quality plan

Acceptance coverage will verify navigation, public route composition, article completeness, sanitization, summary arithmetic, tracked-link validation, guarded prompt text, and formula-safe export. Browser QA will cover anonymous desktop light and mobile dark modes, keyboard-accessible controls, example and reset behavior, persistence, preview updates, copy and download feedback, invalid-link handling, no global overflow, and no application console errors. The complete `pnpm check:quality` gate and `graphify update .` remain required before the phase is committed.
