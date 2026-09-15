# Seasonal resource presentations

## Behavior

A cooling-center host keeps its normal facility listing during ordinary browsing below the existing heat threshold. The same resource ID switches to its cooling presentation when the weather service reports an official alert or forecast threshold. Unknown/no weather defaults to the normal version. The weather threshold and eligibility rules are unchanged.

Explicit cooling searches, categories, and guides retain access to cooling listings. This is the stated default while the optional guide clarification remains unanswered. A record without an identifiable normal place stays seasonal; no ordinary service is invented.

## Implementation

- Resolve a client presentation before category/search filtering and map marker creation. Preserve source records, IDs, coordinates, links, verification and visibility.
- Remove seasonal title decorations. Prefer supplied ordinary categories, then conservative facility-name hints such as library, senior center, recreation site or school. Existing evidence status remains unchanged.
- Suppress cooling-only descriptions, services, event hours and availability in the normal presentation; those do not establish ordinary service availability.
- Apply the same presentation to full details, ordinary guides and saved resources. Cooling guides retain their source entries. Retain saved IDs against the original source inventory, and keep saved seasonal entries openable without adding them to the ordinary map.
- Prevent an emptied seasonal projection from activating synthetic seed fallback.

## Validation

- 96 targeted root checks and 72 targeted Mobile checks pass; suites overlap and are not an additive count. Focused ESLint, import boundaries, structure and whitespace pass.
- Bandto localhost: Brooklyn Central Library appears under Libraries in ordinary search. Its full details preserve the ordinary name/category. Adding cooling to the query restores Cooling Centers and the cooling detail title. Ordinary search returns to Libraries. No Collect/Share or data action performed.
- Offline census of the explicit curated preview: 5,046 records adapted, including 3,542 cooling-category records. All 3,542 produce ordinary presentations with the same IDs; zero retain the cooling category or cooling-center title decoration. All originals are restored by the active-heat presentation. This is a presentation census, not a live count or evidence of verified service availability; no new records were verified or published.
- Actual weather-alert transition has not been exercised live. Existing weather tests cover threshold calculation; presentation tests cover both modes. No provider settings or weather data changed.
- Source is synchronized by focused edits across root localhost, Profile and Mobile; branch-specific code and test fixtures are preserved. Hosted checks follow the draft pushes. Production remains held.

## Review scope

No database/data/schema or provider changes. No new server, full local build/suite or Graphify refresh. Existing cross-source duplicate facilities and unresolved resource-content evidence remain separate assessment work.
