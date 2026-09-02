# Nonprofit Documentation Library

## Outcome

Create a public, United States-wide knowledge library at `/documentation` for
people starting and operating sustainable nonprofits. The experience should
feel like a first-class Coach House canvas: calm, authoritative, easy to scan,
and useful without an account.

Phase 1 establishes the page system, adaptive navigation, documentation home,
Quickstart, Key Concepts, and one complete Mission article. Later phases expand
the library, add search, connect Marketplace resources, and implement the Brand
Identity tool from the user-provided design.

## Audience and editorial standard

Every article serves two related audiences:

- Founders deciding what to build, how to form it, and what to do next.
- Operators improving the systems, funding, impact, and durability of an
  existing nonprofit.

Guidance is organized by stage so readers can separate immediate work from
future obligations:

1. Exploring: test the need, population, alternatives, and founder fit.
2. Forming: establish governance, legal, financial, and operating foundations.
3. Operating: deliver consistently, document decisions, and measure results.
4. Growing: strengthen systems, partnerships, revenue diversity, and impact.

Pages lead with a direct answer, define important terms, show a concrete
example, provide an actionable process and checklist, identify common mistakes,
and end with related guidance. Legal, tax, compliance, and financial claims use
primary United States sources and display source and review metadata. Examples
are clearly labeled as illustrative.

## Information architecture

### Primary navigation

- Home: `/documentation`
- Quickstart: `/documentation/quickstart`
- Key concepts: `/documentation/key-concepts`

### Best practices

- Mission
- Compliance
- Fundraising
- Marketing
- Frameworks
- Measuring impact
- Sustainability
- Partnerships

### Tools

- Brand identity
- Social media
- Networking
- HR
- Finance
- Legal
- Campaigns
- CRM

### Resources

- Map returns to `/`, the public resource map destination.
- Marketplace will contain vetted tools, discounts, services, and online
  resources in a later phase.

Brand Identity remains out of the published Phase 1 navigation until its tool
design is supplied. It must become a functional tool, not an empty article or
generic placeholder.

## Shell and account-state behavior

The documentation uses the existing canvas and rail framework. It never adds a
second permanent left rail.

| Viewer            | Shell               | Global navigation                                      | Documentation behavior                                                     |
| ----------------- | ------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Anonymous         | Public canvas shell | Coach House brand, theme, log in, sign up              | Full public content; documentation sections occupy the rail                |
| Signed-in free    | App shell           | Find, resource links, upgrade and account controls     | Full public content; documentation sections appear below global navigation |
| Signed-in paid    | App shell           | Workspace, Find, resource links, entitled destinations | Same content; no content fork or paywall                                   |
| Admin or staff    | App shell           | Existing privileged destinations plus resource links   | Same public article content                                                |
| Onboarding locked | App shell           | Existing restricted account state                      | Documentation remains reachable because it is public reference material    |

The existing authenticated resource slot links to `Documentation` for every
account state. This keeps the library in the main rail without changing the
shared primary-navigation chunk. Entitlements continue to control Workspace and
paid destinations only.

## Page design

### Shared frame

- Reuse the existing rounded 28px canvas, theme tokens, sidebar primitives,
  mobile sheet, header, account controls, and shell spacing.
- Use one native vertical article scroll owner inside the canvas.
- Keep article text between roughly 680 and 760 pixels for readable line
  lengths; wider callouts and card grids can extend beyond it.
- Use restrained borders, neutral surfaces, and a small warm Coach House accent.
  Avoid gradients, decorative dashboards, and dense card walls.
- Maintain visible keyboard focus, semantic heading order, 44px mobile targets,
  reduced-motion support, and no horizontal overflow.

### Documentation rail

- Show section labels and article links with the current page clearly marked.
- Keep labels visible in the expanded rail and preserve icon-mode behavior in
  the authenticated shell.
- Use links for navigation and native disclosure only when the section count
  requires it on small screens.
- Put Map and Marketplace at the end under Resources.

### Documentation home

The home page mirrors the hierarchy of the supplied documentation reference
without copying its brand:

1. Short eyebrow and direct H1 explaining the library.
2. A large Quickstart feature with the four nonprofit stages and a clear start
   action.
3. Two audience paths: Start a nonprofit and Strengthen an organization.
4. Best Practices and Tools card groups with concise descriptions.
5. A sources-and-review statement explaining how high-stakes guidance is
   maintained.

### Article template

1. Breadcrumbs and content type.
2. Direct, descriptive H1 and one-sentence answer.
3. Page summary with estimated reading time and reviewed date.
4. On-page contents for long articles.
5. Definition and why it matters.
6. Stage-specific guidance for Exploring, Forming, Operating, and Growing.
7. Clearly labeled illustrative example.
8. Step-by-step framework.
9. Checklist.
10. Common mistakes and corrective guidance.
11. Measures or evidence to monitor.
12. Sources, review metadata, and related next page.

## Content and AI-reference model

Content is stored as typed, server-rendered data in the feature slice. Each
entry has a stable slug, title, description, section, audience, stages,
reviewed date, and source records. The route registry is the only authority for
published documentation paths.

Pages use unique titles and descriptions, canonical URLs, crawlable internal
links, semantic HTML, and appropriate Article and Breadcrumb structured data.
The visible copy remains the source of truth for metadata and structured data.
There are no invisible AI-only pages or unsupported claims.

## Ownership

- Feature UI, content registry, and documentation shell:
  `src/features/nonprofit-documentation/**`
- Composition-only App Router files: `src/app/(public)/documentation/**`
- Shared authenticated rail integration: `src/components/app-shell/**` and
  `src/components/app-sidebar/**`
- Acceptance coverage: `tests/acceptance/nonprofit-documentation.test.ts`
- Session evidence: current monthly log linked from `docs/RUNLOG.md`

## Delivery phases

### Phase 1: page system

- Adaptive rail and authenticated main-navigation entry.
- Documentation home.
- Complete Quickstart and Key Concepts guides using the shared stage-specific
  article contract.
- Complete Mission article demonstrating the final article standard.
- Anonymous, free, paid, onboarding-locked, mobile, desktop, dark, and light
  shell behavior.

### Phase 2: best-practice library

- Publish the remaining Best Practices pages in coherent topic batches.
- Add primary-source review and cross-linking for legal and compliance content.
- Add documentation search once enough content exists to justify it.

### Phase 3: tools and resources

- Publish operational tool pages in coherent batches.
- Build Marketplace around vetted resources, discounts, and tools.
- Implement Brand Identity only after the supplied interaction design is
  reviewed.

### Phase 4: refinement

- Evaluate search behavior, article completion, next-page navigation, source
  freshness, and zero-result gaps.
- Expand examples and state-specific routing only when authoritative sources and
  a sustainable review process are available.

## Git and release cadence

Use one feature branch and one documentation PR for Phase 1. Make a small
design-contract commit, then a small number of substantial implementation
commits divided by stable boundaries: content and routes, shell integration,
and validated visual polish. Do not create a PR per page.

Phase 1 is ready only after focused acceptance tests, route and structure
guardrails, responsive browser checks on port 3010, Graphify refresh, and the
full `pnpm check:quality` release gate.
