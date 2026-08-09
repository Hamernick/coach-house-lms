# Public Resource Map — One-Hour Product Brief

## Execution prompt

You are the product manager and lead engineer presenting Coach House's public
resource map in one hour after a month of development. Show the product vision,
not the ingestion machinery.

The map is a public-resource discovery layer. It must help someone answer three
questions immediately: what kind of help is available, who provides it, and
where or how to access it.

Ship this presentation:

1. Make each resource card category-first. The title is the single primary
   category. The next line is `Place or provider name • City or service area`.
2. Show a credible mix of real resources: food, shelter and housing, health,
   benefits, legal help, community services, web resources, and nonprofit
   organizations. Libraries may remain, but cannot dominate the experience.
3. Prefer authoritative bulk sources and provider directories. Keep raw API and
   provenance endpoints private. Show real provider websites, intake links,
   phone numbers, hours, eligibility, and access instructions when supported.
4. Never turn missing data into a claim. Label omissions clearly, preserve
   review requirements, deduplicate locations, and exclude closed, stale, or
   non-resource records from release.
5. Present proof: total records, category mix, actionable-link coverage,
   location coverage, verification status, and the exact records released.

## Hour-one acceptance

- Category-first cards work on desktop and mobile without overflow.
- The subtitle reads `Place name • City/place` in that order.
- At least one authoritative non-library Chicago cohort is ingested and audited.
- Food, shelter/housing, community service, nonprofit, and web-resource paths
  are represented in the release plan.
- Public links are useful; technical source URLs stay hidden.
- No OpenAI dependency, new admin surface, or unrelated infrastructure work.
- Local tests pass and `/find` returns HTTP 200.
