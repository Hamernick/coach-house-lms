# Nonprofit Marketplace Design

## Decision

Publish `/documentation/marketplace` as a public, server-rendered resource
directory inside the documentation canvas and rail. It is a proof-first library,
not a ranked marketplace or an endorsement system.

The first release uses a deliberately small U.S.-wide catalog whose entries can
be supported by an official provider page. It combines nonprofit software,
discount programs, funding discovery, learning resources, volunteer and pro
bono networks, governance support, and Coach House coaching. It also previews
organizations that have already chosen to publish on the Coach House Map.

The existing authenticated `/marketplace` remains unchanged. Reusing that page
would couple public documentation to dashboard access and older catalog data.
Generating a large set of provider pages is deferred because thin or stale pages
would weaken reader trust, search quality, and machine-readable reference value.

## Audience and access

The page must render for anonymous visitors and remain the same learning surface
for free and paid members. Account state may change the surrounding shell, but
not whether the directory, filters, citations, shortlist, or export can be used.

The directory does not collect an email address, submit an application, connect
an account, or transmit a shortlist. A shortlist is stored only in the current
browser and can be downloaded as a formula-safe CSV.

## Information architecture

1. Answer-first introduction: what the Marketplace is and is not.
2. Four stage cards: how Exploring, Forming, Operating, and Growing teams should
   use the directory.
3. Interactive directory: search and filters encoded in the URL, visible result
   count, rich resource cards, source links, and an empty state.
4. Shortlist workspace: selected items, next-review prompts, clear action, and
   CSV download.
5. Coaching: a first-party Coach House entry without exposing individual coach
   records.
6. Community: a safe preview of already-public Map organizations, linking back
   to their public profiles and the Map.
7. Review method: inclusion, freshness, pricing, and non-endorsement rules.

## Resource record

Each static resource has:

- stable ID, provider, name, type, functions, and nonprofit stages;
- source-supported description and a specific `use when` statement;
- cost model, eligibility summary, geography, delivery mode, language note,
  accessibility note, and account requirement;
- official source URL and label, exact last-reviewed date, planned review date,
  inclusion rationale, and a related Coach House guide where relevant.

The first filters are keyword, resource type, function, stage, and cost model.
The query string is the shareable state. Shortlist state is intentionally not in
the URL because it is a private working choice, not public directory evidence.

## Privacy and publication boundary

- An organization appears in Community only when the existing Map query has
  already established `is_public = true`.
- The Marketplace projection retains only organization ID, public name, public
  slug, public tagline or description, city, state, online-only status, primary
  public group, and public program count.
- Email, phone, street address, postal code, representative, social handles,
  coordinates, internal profile fields, and unpublished programs are excluded.
- Individual Coach House coaches do not appear until an explicit public-profile
  opt-in and field-level publication model exists. Active or authenticated
  coaching records are not evidence of consent to public discovery.
- Imported candidates, raw source queues, and unpublished Map records never
  enter this page.

## Verification and display rules

- An entry needs a direct official source page and a recorded review date.
- Claims are narrow descriptions of the provider's current public offer. The
  page does not restate time-sensitive dollar amounts as durable facts.
- `Free`, `discount`, and `paid or varies` describe an access model, not the
  user's final cost. Cards tell readers to confirm eligibility, terms, fees,
  privacy, accessibility, integrations, security, and contracts with the
  provider.
- Default order is curated for variety and public usefulness, not quality or
  predicted fit. No badges, scores, stars, or “best” labels imply endorsement.
- Expired, unavailable, unsupported, or overdue entries should be held from the
  catalog until reviewed.

## SEO and AI reference contract

The route has a canonical URL, descriptive title and summary, one clear H1,
semantic sections, visible source metadata, and JSON-LD for `CollectionPage`,
`ItemList`, and `BreadcrumbList`. JSON-LD names and URLs must match visible
entries. Filter combinations stay on one canonical page rather than producing
indexable near-duplicates.

Descriptions answer who a resource is for, when it is useful, what access may
require, and where to verify the claim. Provider names are never replaced with
invented product or color names.

## Interaction and responsive behavior

- Server-render the full catalog so it remains useful without client state.
- Enhance it with URL-backed native controls, a local shortlist, clipboard-safe
  feedback, and CSV export after hydration.
- Use existing shadcn controls, semantic labels, 44-pixel mobile targets,
  16-pixel mobile inputs, visible focus, high contrast, and no horizontal page
  overflow.
- On wide screens, filters and shortlist form a compact working band above the
  results. On small screens they stack in reading order; no hidden horizontal
  control strip is required.

## Acceptance

- Anonymous, free, and paid shells can render the same Marketplace content.
- Navigation and CRM next-step links resolve to the canonical route.
- Filter combinations are deterministic and shareable.
- Shortlist values are sanitized against the published catalog before use.
- CSV cells are protected against spreadsheet formula execution.
- Only official source links are used for static catalog claims.
- Only safe fields from already-public Map profiles reach Community cards.
- No individual coaching record, private contact field, or candidate intake row
  is imported or rendered.
- Desktop light and mobile dark browser QA cover filters, empty state, shortlist,
  persistence, export, community presentation, input sizing, overflow, and
  console errors.
