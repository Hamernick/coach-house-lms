import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  PUBLIC_MAP_RESOURCE_CATEGORY_LABELS,
  PUBLIC_MAP_RESOURCE_CATEGORY_ORDER,
  type PublicMapResourceTopLevelCategoryKey,
} from "./resource-categories"
import {
  SUPERADMIN_RESOURCE_SEED_CATEGORY_COPY,
  SUPERADMIN_RESOURCE_SEED_DELIVERY_MODES,
} from "./resource-seed-category-config"
import type { ExternalResourceMapItem } from "./resource-map-items"

const SUPERADMIN_PREVIEW_ORGANIZATION_LIMIT = 8

export const PUBLIC_MAP_SUPERADMIN_RESOURCE_SEED_CITY_ANCHORS = [
  {
    id: "new-york",
    name: "New York",
    city: "New York",
    state: "NY",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    id: "boston",
    name: "Boston",
    city: "Boston",
    state: "MA",
    latitude: 42.3601,
    longitude: -71.0589,
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    city: "Philadelphia",
    state: "PA",
    latitude: 39.9526,
    longitude: -75.1652,
  },
  {
    id: "washington-dc",
    name: "Washington DC",
    city: "Washington",
    state: "DC",
    latitude: 38.9072,
    longitude: -77.0369,
  },
  {
    id: "charlotte",
    name: "Charlotte",
    city: "Charlotte",
    state: "NC",
    latitude: 35.2271,
    longitude: -80.8431,
  },
  {
    id: "atlanta",
    name: "Atlanta",
    city: "Atlanta",
    state: "GA",
    latitude: 33.749,
    longitude: -84.388,
  },
  {
    id: "miami",
    name: "Miami",
    city: "Miami",
    state: "FL",
    latitude: 25.7617,
    longitude: -80.1918,
  },
  {
    id: "nashville",
    name: "Nashville",
    city: "Nashville",
    state: "TN",
    latitude: 36.1627,
    longitude: -86.7816,
  },
  {
    id: "new-orleans",
    name: "New Orleans",
    city: "New Orleans",
    state: "LA",
    latitude: 29.9511,
    longitude: -90.0715,
  },
  {
    id: "chicago",
    name: "Chicago",
    city: "Chicago",
    state: "IL",
    latitude: 41.8781,
    longitude: -87.6298,
  },
  {
    id: "detroit",
    name: "Detroit",
    city: "Detroit",
    state: "MI",
    latitude: 42.3314,
    longitude: -83.0458,
  },
  {
    id: "minneapolis",
    name: "Minneapolis",
    city: "Minneapolis",
    state: "MN",
    latitude: 44.9778,
    longitude: -93.265,
  },
  {
    id: "kansas-city",
    name: "Kansas City",
    city: "Kansas City",
    state: "MO",
    latitude: 39.0997,
    longitude: -94.5786,
  },
  {
    id: "dallas",
    name: "Dallas",
    city: "Dallas",
    state: "TX",
    latitude: 32.7767,
    longitude: -96.797,
  },
  {
    id: "houston",
    name: "Houston",
    city: "Houston",
    state: "TX",
    latitude: 29.7604,
    longitude: -95.3698,
  },
  {
    id: "denver",
    name: "Denver",
    city: "Denver",
    state: "CO",
    latitude: 39.7392,
    longitude: -104.9903,
  },
  {
    id: "salt-lake-city",
    name: "Salt Lake City",
    city: "Salt Lake City",
    state: "UT",
    latitude: 40.7608,
    longitude: -111.891,
  },
  {
    id: "phoenix",
    name: "Phoenix",
    city: "Phoenix",
    state: "AZ",
    latitude: 33.4484,
    longitude: -112.074,
  },
  {
    id: "albuquerque",
    name: "Albuquerque",
    city: "Albuquerque",
    state: "NM",
    latitude: 35.0844,
    longitude: -106.6504,
  },
  {
    id: "las-vegas",
    name: "Las Vegas",
    city: "Las Vegas",
    state: "NV",
    latitude: 36.1699,
    longitude: -115.1398,
  },
  {
    id: "los-angeles",
    name: "Los Angeles",
    city: "Los Angeles",
    state: "CA",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    city: "San Francisco",
    state: "CA",
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: "portland",
    name: "Portland",
    city: "Portland",
    state: "OR",
    latitude: 45.5152,
    longitude: -122.6784,
  },
  {
    id: "seattle",
    name: "Seattle",
    city: "Seattle",
    state: "WA",
    latitude: 47.6062,
    longitude: -122.3321,
  },
] as const

export const PUBLIC_MAP_SUPERADMIN_RESOURCE_SEED_ITEMS = [
  {
    id: "seed-resource:food-water-west-loop",
    itemType: "external_resource",
    title: "Seed Food + Water Access",
    subtitle: "Food, water",
    description:
      "Superadmin preview seed for pantry, meal, and bottled water access markers.",
    latitude: 41.883731,
    longitude: -87.647772,
    address: "Superadmin seed location, West Loop, Chicago, IL",
    addressStreet: "Superadmin seed location",
    city: "Chicago",
    state: "IL",
    country: "United States",
    orgCategory: null,
    resourceCategories: ["food", "food_water"],
    primaryResourceCategory: "food",
    verificationStatus: "pending_review",
    sourceLabel: "Coach House seed data",
    sourceUrl: null,
    lastVerifiedAt: null,
    visibility: "superadmin_preview",
    markerImageUrl: null,
  },
  {
    id: "seed-resource:shelter-west-loop",
    itemType: "external_resource",
    title: "Seed Shelter Intake",
    subtitle: "Shelter",
    description:
      "Superadmin preview seed sharing a location with the food/water marker to exercise same-location counts.",
    latitude: 41.883731,
    longitude: -87.647772,
    address: "Superadmin seed location, West Loop, Chicago, IL",
    addressStreet: "Superadmin seed location",
    city: "Chicago",
    state: "IL",
    country: "United States",
    orgCategory: null,
    resourceCategories: ["housing", "housing_emergency_shelter"],
    primaryResourceCategory: "housing",
    verificationStatus: "pending_review",
    sourceLabel: "Coach House seed data",
    sourceUrl: null,
    lastVerifiedAt: null,
    visibility: "superadmin_preview",
    markerImageUrl: null,
  },
  {
    id: "seed-resource:medical-dental-pilsen",
    itemType: "external_resource",
    title: "Seed Medical + Dental Clinic",
    subtitle: "Medical, dental, women's health",
    description:
      "Superadmin preview seed for a multi-category care resource marker.",
    latitude: 41.856608,
    longitude: -87.656815,
    address: "Superadmin seed location, Pilsen, Chicago, IL",
    addressStreet: "Superadmin seed location",
    city: "Chicago",
    state: "IL",
    country: "United States",
    orgCategory: null,
    resourceCategories: ["health", "health_dental", "health_womens_health"],
    primaryResourceCategory: "health",
    verificationStatus: "external_data",
    sourceLabel: "Coach House seed data",
    sourceUrl: null,
    lastVerifiedAt: null,
    visibility: "superadmin_preview",
    markerImageUrl: null,
  },
  {
    id: "seed-resource:jobs-transport-bronzeville",
    itemType: "external_resource",
    title: "Seed Job Placement Desk",
    subtitle: "Jobs, transportation",
    description:
      "Superadmin preview seed for employment support and transportation navigation.",
    latitude: 41.816865,
    longitude: -87.617013,
    address: "Superadmin seed location, Bronzeville, Chicago, IL",
    addressStreet: "Superadmin seed location",
    city: "Chicago",
    state: "IL",
    country: "United States",
    orgCategory: null,
    resourceCategories: ["employment", "community_transportation"],
    primaryResourceCategory: "employment",
    verificationStatus: "external_data",
    sourceLabel: "Coach House seed data",
    sourceUrl: null,
    lastVerifiedAt: null,
    visibility: "superadmin_preview",
    markerImageUrl: null,
  },
] as const satisfies ExternalResourceMapItem[]

function buildSeedUrl({
  anchorId,
  category,
  path,
}: {
  anchorId: string
  category: PublicMapResourceTopLevelCategoryKey
  path: string
}) {
  return `https://example.org/${path}/${anchorId}/${category}`
}

function buildSeedPhone(anchorIndex: number, categoryIndex: number) {
  const suffix = String(1000 + anchorIndex * 13 + categoryIndex).slice(-4)
  return {
    label: `(312) 555-${suffix}`,
    href: `tel:+1312555${suffix}`,
  }
}

function organizationHasSeedLocation(
  organization: PublicMapOrganization
): organization is PublicMapOrganization & {
  latitude: number
  longitude: number
} {
  return (
    typeof organization.latitude === "number" &&
    typeof organization.longitude === "number"
  )
}

function buildSeedCoordinateOffset({
  anchorSpread = "local",
  categoryIndex,
  anchorIndex,
}: {
  anchorSpread?: "local" | "national"
  categoryIndex: number
  anchorIndex: number
}) {
  const angle = ((categoryIndex * 137.5 + anchorIndex * 31) * Math.PI) / 180
  const baseRadius = anchorSpread === "national" ? 0.055 : 0.0035
  const radiusStep = anchorSpread === "national" ? 0.018 : 0.0017
  const radius = baseRadius + (categoryIndex % 4) * radiusStep
  return {
    latitudeOffset: Math.sin(angle) * radius,
    longitudeOffset: Math.cos(angle) * radius,
  }
}

function buildResourceSeedItem({
  anchorId,
  anchorIndex,
  anchorName,
  address,
  category,
  categoryIndex,
  city,
  latitude,
  longitude,
  state,
  anchorSpread,
}: {
  anchorId: string
  anchorIndex: number
  anchorName: string
  address: string
  category: PublicMapResourceTopLevelCategoryKey
  categoryIndex: number
  city: string | null
  latitude: number
  longitude: number
  state: string | null
  anchorSpread: "local" | "national"
}): ExternalResourceMapItem {
  const { latitudeOffset, longitudeOffset } = buildSeedCoordinateOffset({
    anchorSpread,
    categoryIndex,
    anchorIndex,
  })
  const copy = SUPERADMIN_RESOURCE_SEED_CATEGORY_COPY[category]
  const categoryLabel = PUBLIC_MAP_RESOURCE_CATEGORY_LABELS[category]
  const previewScope = anchorSpread === "national" ? "national" : "preview"
  const id = `seed-resource:${previewScope}:${anchorId}:${category}`
  const deliveryModes = SUPERADMIN_RESOURCE_SEED_DELIVERY_MODES[category]
  const seedPhone = buildSeedPhone(anchorIndex, categoryIndex)
  const intakeUrl = buildSeedUrl({ anchorId, category, path: "intake" })
  const resourceUrl = buildSeedUrl({ anchorId, category, path: "resources" })

  return {
    id,
    itemType: "external_resource",
    title: `Seed ${copy.noun}`,
    subtitle: `${categoryLabel} near ${anchorName}`,
    description: copy.description,
    latitude: latitude + latitudeOffset,
    longitude: longitude + longitudeOffset,
    address,
    addressStreet: "Superadmin seed location",
    city,
    state,
    country: "United States",
    orgCategory: null,
    resourceCategories: [category],
    primaryResourceCategory: category,
    verificationStatus:
      categoryIndex % 3 === 0 ? "pending_review" : "external_data",
    sourceLabel: "Coach House seed data",
    sourceUrl: null,
    lastVerifiedAt: null,
    visibility: "superadmin_preview",
    markerImageUrl: null,
    deliveryModes,
    hoursLabel: "Preview hours vary by provider",
    lastUpdatedAt: null,
    links: [
      {
        id: `${id}:link:resource`,
        label: `${categoryLabel} resource page`,
        url: resourceUrl,
        type: "resource",
        domain: "example.org",
        isPrimary: true,
      },
      {
        id: `${id}:link:intake`,
        label: "Intake or referral",
        url: intakeUrl,
        type: "intake",
        domain: "example.org",
      },
    ],
    contacts: [
      {
        id: `${id}:contact:phone`,
        label: "Intake phone",
        value: seedPhone.label,
        type: "phone",
        url: seedPhone.href,
        isPrimary: true,
      },
    ],
    services: [
      {
        id: `${id}:service:primary`,
        title: copy.noun,
        description: copy.description,
        whoItHelps: "People looking for nearby nonprofit resource support.",
        eligibility: "Preview eligibility field for imported data.",
        cost: "Free or low-cost",
        languages: ["English", "Spanish"],
        intakeUrl,
        appointmentInfo: "Walk-in and appointment details will display here.",
        documentsNeeded: ["Photo ID if available"],
        accessibilityNotes:
          "Accessibility notes will appear when available from the source.",
        urgentAvailability:
          category === "housing" || category === "health"
            ? "Urgent availability may change daily."
            : null,
        ageRange: "All ages unless noted",
        serviceArea: city && state ? [`${city}, ${state}`] : [],
        deliveryModes,
      },
    ],
  }
}

export function buildPublicMapSuperadminResourceSeedItems(
  organizations: PublicMapOrganization[]
): ExternalResourceMapItem[] {
  const anchorOrganizations = organizations
    .filter(organizationHasSeedLocation)
    .slice(0, SUPERADMIN_PREVIEW_ORGANIZATION_LIMIT)

  const nationalSeedItems =
    PUBLIC_MAP_SUPERADMIN_RESOURCE_SEED_CITY_ANCHORS.flatMap(
      (anchor, anchorIndex) =>
        PUBLIC_MAP_RESOURCE_CATEGORY_ORDER.map((category, categoryIndex) =>
          buildResourceSeedItem({
            anchorId: anchor.id,
            anchorIndex,
            anchorName: anchor.name,
            address: `Superadmin national seed, ${anchor.city}, ${anchor.state}`,
            category,
            categoryIndex,
            city: anchor.city,
            latitude: anchor.latitude,
            longitude: anchor.longitude,
            state: anchor.state,
            anchorSpread: "national",
          })
        )
    )

  const organizationSeedItems = anchorOrganizations.flatMap(
    (organization, organizationIndex) =>
      PUBLIC_MAP_RESOURCE_CATEGORY_ORDER.map((category, categoryIndex) =>
        buildResourceSeedItem({
          anchorId: organization.id,
          anchorIndex: organizationIndex,
          anchorName: organization.name,
          address: `Superadmin seed near ${organization.name}`,
          categoryIndex,
          category,
          city: organization.city,
          latitude: organization.latitude,
          longitude: organization.longitude,
          state: organization.state,
          anchorSpread: "local",
        })
      )
  )

  return [
    ...PUBLIC_MAP_SUPERADMIN_RESOURCE_SEED_ITEMS,
    ...nationalSeedItems,
    ...organizationSeedItems,
  ]
}
