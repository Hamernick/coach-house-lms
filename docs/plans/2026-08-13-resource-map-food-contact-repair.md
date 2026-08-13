# Illinois food listing contact repair

Date: 2026-08-13

## Outcome

The saved Feeding Illinois group contains 752 food listings. Twelve listings
had a provider phone number in the public source's `contactPhone` field, but the
importer only read the empty `phone` field.

The importer now uses `contactPhone` when `phone` is empty.

| Result                                               | Before | After |
| ---------------------------------------------------- | -----: | ----: |
| Listings with contact information or a provider link |    644 |   656 |
| Listings with contact information and two sources    |    615 |   626 |
| Listings with two sources                            |    649 |   649 |

Eleven of the twelve repaired listings now have contact information and two
sources. Church of the Holy Spirit–Lake Forest still lacks a second source and
remains held.

No contact names were exposed. Nothing was imported, approved, published, or
changed in production.

## Evidence

- Input artifact: `feeding-illinois-food-resources.provider-verified.jsonl`
- Input SHA-256:
  `260b7265f0212a3bd6d5d23519e841b5915d1fbea54f0c918509e04cb9cc404d`
- Focused importer and coverage tests: 8 passed.
