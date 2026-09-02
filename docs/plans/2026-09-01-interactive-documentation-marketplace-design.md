# Interactive Documentation and Marketplace

## Outcome

Make `/documentation` a public, U.S.-wide nonprofit operating library that is
useful to people and dependable as a search or AI reference. Articles combine
clear stage-specific guidance with focused interactive tools. Marketplace
connects that guidance to real coaches, organizations, software, discounts,
funding sources, and public resources without turning the library into an
affiliate directory.

## Editorial contract

Every substantive guide must:

1. Answer the page's central question immediately.
2. Define the subject and explain why it matters.
3. Separate Exploring, Forming, Operating, and Growing guidance.
4. Show a clearly fictional or attributed real-world example.
5. Provide a repeatable framework, checklist, mistakes, and evidence to watch.
6. Cite primary government, regulator, standards-body, or provider sources for
   factual claims.
7. Display publication, review, and modification dates.
8. State limitations where jurisdiction, organizational type, or professional
   judgment can change the answer.

Coach House accelerator PDFs can inform sequencing, prompts, examples, and
worksheets after their provenance and publication rights are confirmed. They
do not replace current primary sources for legal, tax, employment, or financial
claims.

## Interactive article system

Use one server-rendered article contract for headings, metadata, structured
data, stages, examples, sources, and related navigation. Insert an optional
client-side sandbox after stage guidance when interaction improves the user's
decision.

Each sandbox must:

- solve one bounded task;
- work without an account or payment;
- save only on the device unless sync is explicitly added later;
- label assumptions and distinguish planning output from determinations;
- offer a useful example, reset, and portable download when appropriate;
- use semantic fields, keyboard access, visible focus, and an accessible live
  status message;
- keep the surrounding explanation and result crawlable when JavaScript is not
  available.

The first pilot is the Compliance Rhythm Builder. It turns a state, tax-year
end, common Form 990-series receipt and asset bands, solicitation activity, and
employment status into a planning calendar. It links to official sources and
never claims to determine the user's obligations.

Future sandboxes should follow the same restraint. Examples include a mission
statement test, program logic-model builder, board-role matrix, campaign brief,
budget scenario, and CRM field planner. A guide should not receive a sandbox
when a checklist or worked example is clearer.

## Tools

The navigation section is named `Tools`, never `Toolbox`. Tools are complete
public utilities rather than thin articles. Brand Identity is canonical at
`/documentation/tools/brand-identity`; its earlier path redirects to preserve
existing links.

## Rich references

External resources appear as evidence-rich previews with:

- exact resource and provider name;
- resource type and intended nonprofit stage;
- factual description based on the provider's page;
- price or discount status with a verified date;
- eligibility, geography, language, accessibility, and account requirements;
- source URL, last checked date, and an explicit external-link label;
- an explanation of why the item appears in the guide.

Provider claims, prices, discounts, deadlines, and program availability must be
rechecked before publication and on a maintained review cadence. Expired or
unverified items are held from public results rather than guessed.

## Marketplace model

Marketplace is a typed directory with distinct result classes:

- Coaches: public Coach House profiles with services, experience, geography,
  delivery mode, languages, availability, and applicable verification state.
- Community: public user or organization profiles that explicitly opt into
  discovery and select the information shown.
- Nonprofit software: products with nonprofit-specific use cases, pricing, and
  integration details.
- Discounts: programs with current eligibility rules, application links,
  savings structure, and last-verified dates.
- Operational resources: templates, training, data, standards, and technical
  assistance.
- Funding: public grant programs, funder directories, fiscal sponsorship, and
  capital resources with geography, stage, eligibility, and deadlines.
- Professional services: legal, accounting, HR, fundraising, evaluation,
  communications, and technology providers with transparent inclusion rules.

No imported user, coach, or organization profile becomes public by default.
Publication requires explicit visibility controls and field-level selection.
Marketplace source intake remains private until evidence, verification, and
publication review are complete.

## Discovery and linking

Guides link to Marketplace through contextual queries such as `Formation legal
support`, `Volunteer management software`, or `Capacity-building grants`, not
generic promotional carousels. Marketplace results link back to the guide that
explains how to evaluate the category. Filters should cover stage, resource
type, nonprofit function, location, remote availability, price, eligibility,
language, accessibility, and verification recency.

Map remains the link back to the public map at `/`. Marketplace receives its
own route in a later implementation phase after its data contract, privacy
controls, review workflow, and minimum verified inventory are ready.

## Delivery sequence

1. Generalize the article renderer and publish Compliance with the first
   sandbox.
2. Validate the article and sandbox pattern across devices, themes, and account
   states.
3. Inventory accelerator PDFs and approved external source types; define
   provenance and review metadata.
4. Design the Marketplace schema, privacy controls, source-review workflow, and
   rich-preview component.
5. Publish a small verified Marketplace cohort spanning coaches, software,
   discounts, operational resources, and funding.
6. Add contextual guide-to-Marketplace queries, search, freshness monitoring,
   and removal workflows.

## Acceptance

- Public documentation works for anonymous, free, paid, locked, staff, desktop,
  mobile, light, and dark states.
- Article content remains server rendered with unique canonical metadata,
  Article and Breadcrumb structured data, semantic internal links, and visible
  sources.
- Interactive outputs never present estimates or planning assumptions as legal,
  tax, funding, or eligibility determinations.
- Marketplace items expose provenance, verification date, and applicability;
  private intake and opt-out records never appear publicly.
- Focused tests, responsive browser checks, Graphify refresh, and the repository
  quality gate pass before release.
