# Immigrant and refugee provider evidence repair

Date: 2026-08-13

Status: local Wave 6 evidence repair. No record was imported, approved,
published, or changed in production.

## Result

- The Cook County directory cohort contains `84` records. `79` name a specific
  service and remain eligible for review; five do not.
- The previous provider-page artifact gave `68/84` records two-source identity
  evidence.
- A current bounded refresh raised that to `79/84`: nine provider pages now
  fetch and match under the existing rules, and two established organization
  acronyms now match under the new strict rule.
- `74/79` service-eligible records now have two-source identity evidence. The
  other five remain held.

## Matching rule

An acronym counts only when it is four to ten letters, is derived from the
provider's full name after removing connectors and Chicago/Illinois location
words, and appears either as a whole page-text token or in the same-site domain.
A successful page fetch alone still does not count as a second source.

This closes the valid `HIAS` page-text match for Hebrew Immigrant Aid Society
of Chicago and the `CASL` domain match for Chinese American Service League.

## Held records

- Access Living and Council on American-Islamic Relations returned HTTP `403`.
- Chinese Mutual Aid Association exceeded the bounded page-size limit.
- Albany Park Community Center has no retained safe provider website.
- Japanese American Citizens League returned an unusable redirect response.

These records keep one-source or missing-provider status. No override was
added.

## Verification

- Current provider comparison: `supported=79`, `unavailable=4`,
  `no_website=1` across `84` records.
- Focused provider comparison and Cook County importer tests: `10/10` pass.
- Output stayed in ignored/local artifacts under `/private/tmp`.
