import {
  resolvePublicMapItemSelectableId,
  type PublicMapItem,
} from "@/lib/public-map/resource-map-items"
import type { PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"

export type PublicMapResourceGuideVisualVariant =
  | "nyc"
  | "borough"
  | "library"
  | "senior"
  | "community"
  | "hydration"
  | "city"

export type PublicMapResourceGuide = {
  id: string
  title: string
  subtitle: string
  kicker: string
  itemCount: number
  items: PublicMapItem[]
  imageUrl?: string | null
  primaryResourceCategory: PublicMapResourceCategoryKey
  visualVariant: PublicMapResourceGuideVisualVariant
}

type PublicMapResourceGuideDefinition = {
  id: string
  title: string
  subtitle: string
  kicker: string
  minItems?: number
  primaryResourceCategory?: PublicMapResourceCategoryKey
  visualVariant: PublicMapResourceGuideVisualVariant
  matches: (item: PublicMapItem) => boolean
}

const guideItemCorpusByItem = new WeakMap<PublicMapItem, string>()
const coolingCenterGuideMatchByItem = new WeakMap<PublicMapItem, boolean>()

function normalizeGuideText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function buildGuideItemCorpus(item: PublicMapItem) {
  const cached = guideItemCorpusByItem.get(item)
  if (cached !== undefined) return cached

  const corpus = [
    item.title,
    item.subtitle,
    item.description,
    item.address,
    item.addressStreet,
    item.city,
    item.state,
    item.country,
    item.sourceLabel,
    item.sourceUrl,
    item.hoursLabel,
    ...(item.aliases ?? []),
    ...(item.services ?? []).flatMap((service) => [
      service.title,
      service.description,
      service.whoItHelps,
      service.eligibility,
      service.urgentAvailability,
      service.appointmentInfo,
      ...(service.serviceArea ?? []),
      ...(service.documentsNeeded ?? []),
      ...(service.languages ?? []),
    ]),
  ]
    .map(normalizeGuideText)
    .filter(Boolean)
    .join(" ")
  guideItemCorpusByItem.set(item, corpus)
  return corpus
}

function itemHasAnyText(item: PublicMapItem, terms: readonly string[]) {
  const corpus = buildGuideItemCorpus(item)
  return terms.some((term) => corpus.includes(term))
}

function itemCityMatches(item: PublicMapItem, cities: readonly string[]) {
  const city = normalizeGuideText(item.city)
  return cities.some((candidate) => city === candidate.toLowerCase())
}

function itemStateMatches(item: PublicMapItem, states: readonly string[]) {
  const state = normalizeGuideText(item.state)
  return states.some((candidate) => state === candidate.toLowerCase())
}

function isCoolingCenterGuideItem(item: PublicMapItem) {
  const cached = coolingCenterGuideMatchByItem.get(item)
  if (cached !== undefined) return cached

  const matches =
    item.resourceCategories.includes("emergency_cooling_centers") ||
    itemHasAnyText(item, [
      "cooling center",
      "cooling centers",
      "cooling site",
      "cooling sites",
      "cooling location",
      "heat relief",
      "hydration station",
      "hydration stations",
    ])
  coolingCenterGuideMatchByItem.set(item, matches)
  return matches
}

function isNycCoolingCenterItem(item: PublicMapItem) {
  if (!isCoolingCenterGuideItem(item)) return false
  if (itemHasAnyText(item, ["nyc-arcgis-cooling-centers"])) return true

  return itemCityMatches(item, [
    "New York",
    "Manhattan",
    "Brooklyn",
    "Queens",
    "Bronx",
    "Staten Island",
  ])
}

const PUBLIC_MAP_RESOURCE_GUIDE_DEFINITIONS = [
  {
    id: "nyc-cooling-centers",
    title: "NYC Cooling Centers",
    subtitle: "Cooling and heat relief locations across the five boroughs.",
    kicker: "New York",
    minItems: 10,
    visualVariant: "nyc",
    matches: isNycCoolingCenterItem,
  },
  {
    id: "manhattan-cooling-centers",
    title: "Manhattan Cooling Centers",
    subtitle: "Cooling locations in Manhattan.",
    kicker: "Borough guide",
    visualVariant: "borough",
    matches: (item) =>
      isCoolingCenterGuideItem(item) && itemCityMatches(item, ["Manhattan"]),
  },
  {
    id: "brooklyn-cooling-centers",
    title: "Brooklyn Cooling Centers",
    subtitle: "Cooling locations in Brooklyn.",
    kicker: "Borough guide",
    visualVariant: "borough",
    matches: (item) =>
      isCoolingCenterGuideItem(item) && itemCityMatches(item, ["Brooklyn"]),
  },
  {
    id: "queens-cooling-centers",
    title: "Queens Cooling Centers",
    subtitle: "Cooling locations in Queens.",
    kicker: "Borough guide",
    visualVariant: "borough",
    matches: (item) =>
      isCoolingCenterGuideItem(item) && itemCityMatches(item, ["Queens"]),
  },
  {
    id: "bronx-cooling-centers",
    title: "Bronx Cooling Centers",
    subtitle: "Cooling locations in the Bronx.",
    kicker: "Borough guide",
    visualVariant: "borough",
    matches: (item) =>
      isCoolingCenterGuideItem(item) && itemCityMatches(item, ["Bronx"]),
  },
  {
    id: "staten-island-cooling-centers",
    title: "Staten Island Cooling Centers",
    subtitle: "Cooling locations on Staten Island.",
    kicker: "Borough guide",
    visualVariant: "borough",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      itemCityMatches(item, ["Staten Island"]),
  },
  {
    id: "library-cooling-centers",
    title: "Library Cooling Centers",
    subtitle: "Libraries currently listed as cooling or heat relief sites.",
    kicker: "Facility guide",
    minItems: 5,
    primaryResourceCategory: "community_libraries",
    visualVariant: "library",
    matches: (item) =>
      isCoolingCenterGuideItem(item) && itemHasAnyText(item, ["library"]),
  },
  {
    id: "senior-cooling-centers",
    title: "Senior Cooling Centers",
    subtitle: "Senior and older-adult cooling locations.",
    kicker: "Facility guide",
    minItems: 3,
    primaryResourceCategory: "family_seniors",
    visualVariant: "senior",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      itemHasAnyText(item, ["senior", "older adult", "aging"]),
  },
  {
    id: "community-center-cooling",
    title: "Community Center Cooling",
    subtitle: "Community and recreation centers opened for cooling.",
    kicker: "Facility guide",
    minItems: 5,
    primaryResourceCategory: "community_community_centers",
    visualVariant: "community",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      itemHasAnyText(item, [
        "community center",
        "community centre",
        "recreation center",
        "recreation centre",
        "rec center",
      ]),
  },
  {
    id: "hydration-sites",
    title: "Hydration Sites",
    subtitle: "Heat relief locations that call out hydration support.",
    kicker: "Heat relief",
    minItems: 5,
    primaryResourceCategory: "food_water",
    visualVariant: "hydration",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      itemHasAnyText(item, ["hydration station", "hydration stations"]),
  },
  {
    id: "chicago-cooling-centers",
    title: "Chicago Cooling Centers",
    subtitle: "Cooling locations across Chicago.",
    kicker: "City guide",
    minItems: 10,
    visualVariant: "city",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      itemCityMatches(item, ["Chicago"]) &&
      itemStateMatches(item, ["IL", "Illinois"]),
  },
  {
    id: "phoenix-heat-relief",
    title: "Phoenix Heat Relief",
    subtitle: "Cooling and hydration locations around Phoenix.",
    kicker: "City guide",
    minItems: 10,
    visualVariant: "city",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      (itemCityMatches(item, [
        "Phoenix",
        "Mesa",
        "Glendale",
        "Tempe",
        "Scottsdale",
        "Chandler",
        "Peoria",
        "Surprise",
        "Avondale",
        "Buckeye",
        "Gilbert",
      ]) ||
        itemHasAnyText(item, ["maricopa", "heat relief network"])),
  },
  {
    id: "houston-cooling-centers",
    title: "Houston Cooling Centers",
    subtitle: "Cooling locations across Houston.",
    kicker: "City guide",
    minItems: 10,
    visualVariant: "city",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      itemCityMatches(item, ["Houston"]) &&
      itemStateMatches(item, ["TX", "Texas"]),
  },
  {
    id: "miami-cooling-centers",
    title: "Miami Cooling Centers",
    subtitle: "Cooling locations around Miami-Dade.",
    kicker: "City guide",
    minItems: 5,
    visualVariant: "city",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      (itemCityMatches(item, ["Miami"]) ||
        itemHasAnyText(item, ["miami-dade", "broward"])),
  },
  {
    id: "la-cooling-centers",
    title: "Los Angeles Cooling Centers",
    subtitle: "Cooling locations around Los Angeles County.",
    kicker: "City guide",
    minItems: 5,
    visualVariant: "city",
    matches: (item) =>
      isCoolingCenterGuideItem(item) &&
      (itemCityMatches(item, [
        "Los Angeles",
        "Torrance",
        "Inglewood",
        "Riverside",
      ]) ||
        itemHasAnyText(item, ["los angeles", "la county"])),
  },
] satisfies PublicMapResourceGuideDefinition[]

function buildGuideItems({
  definition,
  items,
}: {
  definition: PublicMapResourceGuideDefinition
  items: PublicMapItem[]
}) {
  const seenIds = new Set<string>()
  const guideItems: PublicMapItem[] = []

  for (const item of items) {
    if (!definition.matches(item)) continue
    const selectableId = resolvePublicMapItemSelectableId(item)
    if (seenIds.has(selectableId)) continue
    seenIds.add(selectableId)
    guideItems.push(item)
  }

  return guideItems.sort((a, b) => a.title.localeCompare(b.title))
}

export function buildPublicMapResourceGuides(
  items: PublicMapItem[]
): PublicMapResourceGuide[] {
  const guides: PublicMapResourceGuide[] = []

  for (const definition of PUBLIC_MAP_RESOURCE_GUIDE_DEFINITIONS) {
    const guideItems = buildGuideItems({ definition, items })
    const minItems = definition.minItems ?? 1
    if (guideItems.length < minItems) continue

    guides.push({
      id: definition.id,
      title: definition.title,
      subtitle: definition.subtitle,
      kicker: definition.kicker,
      itemCount: guideItems.length,
      items: guideItems,
      primaryResourceCategory:
        definition.primaryResourceCategory ?? "emergency_cooling_centers",
      visualVariant: definition.visualVariant,
    })
  }

  return guides
}
