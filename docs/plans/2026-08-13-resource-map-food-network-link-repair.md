# Cook County food finder link repair

Date: 2026-08-13

## Outcome

Twenty Cook County food listings have no direct provider phone, email, or
website. Their source records identify them as part of the Greater Chicago Food
Depository region.

The importer now gives those listings the food bank's official find-food page
as an intake path. It is labeled as a food-bank finder, not as the individual
provider's website or as independent proof of that location.

| Result                                                              | Before | After |
| ------------------------------------------------------------------- | -----: | ----: |
| Listings with contact information or an intake link                 |    656 |   676 |
| Listings with contact information or an intake link and two sources |    626 |   645 |
| Listings with two sources                                           |    649 |   649 |

Nineteen of the twenty listings already have two sources. One still lacks a
second source and remains held. Seventy-six food listings still lack direct
contact information or a verified intake link.

Nothing was imported, approved, published, or changed in production.

## Evidence

- Official intake page:
  `https://www.chicagosfoodbank.org/find-food/`
- Input artifact: `feeding-illinois-food-resources.provider-verified.jsonl`
- Input SHA-256:
  `260b7265f0212a3bd6d5d23519e841b5915d1fbea54f0c918509e04cb9cc404d`
- Focused importer and coverage tests: 9 passed.
