import type {
  MarketplaceCommunityProfile,
  MarketplaceCostModel,
  MarketplaceFilters,
  MarketplaceFunction,
  MarketplaceResource,
  MarketplaceResourceType,
} from "../marketplace-types"
import type { DocumentationStageId } from "../types"
import {
  MARKETPLACE_COST_MODELS,
  MARKETPLACE_FUNCTIONS,
  MARKETPLACE_RESOURCES,
  MARKETPLACE_RESOURCE_TYPES,
  MARKETPLACE_STAGES,
} from "./marketplace-resources"

export {
  DEFAULT_MARKETPLACE_FILTERS,
  MARKETPLACE_COST_MODELS,
  MARKETPLACE_FUNCTIONS,
  MARKETPLACE_RESOURCES,
  MARKETPLACE_RESOURCE_TYPES,
  MARKETPLACE_SHORTLIST_STORAGE_KEY,
  MARKETPLACE_STAGES,
} from "./marketplace-resources"

function optionValue<T extends string>(
  input: string | undefined,
  options: Array<{ value: T }>
): T | "all" {
  if (!input || input === "all") return "all"
  return options.some((option) => option.value === input) ? (input as T) : "all"
}

export function sanitizeMarketplaceFilters(
  input: Partial<Record<keyof MarketplaceFilters, string | undefined>>
): MarketplaceFilters {
  return {
    query: (input.query ?? "").trim().slice(0, 100),
    type: optionValue(input.type, MARKETPLACE_RESOURCE_TYPES),
    function: optionValue(input.function, MARKETPLACE_FUNCTIONS),
    stage: optionValue(input.stage, MARKETPLACE_STAGES),
    cost: optionValue(input.cost, MARKETPLACE_COST_MODELS),
  }
}

export function filterMarketplaceResources(
  resources: MarketplaceResource[],
  filters: MarketplaceFilters
) {
  const needle = filters.query.trim().toLocaleLowerCase()
  return resources.filter((resource) => {
    const searchable = [
      resource.name,
      resource.provider,
      resource.description,
      resource.useWhen,
      resource.eligibility,
      resource.functions.join(" "),
    ]
      .join(" ")
      .toLocaleLowerCase()

    return (
      (!needle || searchable.includes(needle)) &&
      (filters.type === "all" || resource.type === filters.type) &&
      (filters.function === "all" ||
        resource.functions.includes(filters.function)) &&
      (filters.stage === "all" || resource.stages.includes(filters.stage)) &&
      (filters.cost === "all" || resource.costModel === filters.cost)
    )
  })
}

export function sanitizeMarketplaceShortlist(
  value: unknown,
  resources: MarketplaceResource[] = MARKETPLACE_RESOURCES
) {
  if (!Array.isArray(value)) return []
  const validIds = new Set(resources.map((resource) => resource.id))
  return [
    ...new Set(value.filter((id): id is string => typeof id === "string")),
  ]
    .filter((id) => validIds.has(id))
    .slice(0, 20)
}

function csvCell(value: string | number) {
  const raw = String(value)
  const protectedValue = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return `"${protectedValue.replaceAll('"', '""')}"`
}

export function buildMarketplaceShortlistCsv(
  resourceIds: string[],
  resources: MarketplaceResource[] = MARKETPLACE_RESOURCES
) {
  const ids = new Set(sanitizeMarketplaceShortlist(resourceIds, resources))
  const selected = resources.filter((resource) => ids.has(resource.id))
  const header = [
    "Resource",
    "Provider",
    "Type",
    "Cost model",
    "Use when",
    "Eligibility",
    "Official source",
    "Reviewed",
    "Review by",
    "Team notes",
  ]
  return [
    header.map(csvCell).join(","),
    ...selected.map((resource) =>
      [
        resource.name,
        resource.provider,
        marketplaceTypeLabel(resource.type),
        marketplaceCostLabel(resource.costModel),
        resource.useWhen,
        resource.eligibility,
        resource.url,
        resource.reviewedDate,
        resource.reviewByDate,
        "",
      ]
        .map(csvCell)
        .join(",")
    ),
  ].join("\n")
}

export function marketplaceTypeLabel(type: MarketplaceResourceType) {
  return (
    MARKETPLACE_RESOURCE_TYPES.find((option) => option.value === type)?.label ??
    type
  )
}

export function marketplaceFunctionLabel(value: MarketplaceFunction) {
  return (
    MARKETPLACE_FUNCTIONS.find((option) => option.value === value)?.label ??
    value
  )
}

export function marketplaceCostLabel(value: MarketplaceCostModel) {
  return (
    MARKETPLACE_COST_MODELS.find((option) => option.value === value)?.label ??
    value
  )
}

export function marketplaceStageLabel(value: DocumentationStageId) {
  return (
    MARKETPLACE_STAGES.find((option) => option.value === value)?.label ?? value
  )
}

export type MarketplaceCommunitySource = {
  id: string
  name: string
  publicSlug: string | null
  tagline: string | null
  description: string | null
  city: string | null
  state: string | null
  country: string | null
  isOnlineOnly: boolean
  primaryGroup: string
  programCount: number
}

export function projectMarketplaceCommunityProfiles(
  organizations: MarketplaceCommunitySource[],
  limit = 6
): MarketplaceCommunityProfile[] {
  return organizations
    .filter((organization) => Boolean(organization.publicSlug))
    .slice(0, Math.max(0, Math.min(limit, 12)))
    .map((organization) => {
      const localParts = [organization.city, organization.state].filter(Boolean)
      const location = organization.isOnlineOnly
        ? "Online"
        : localParts.join(", ") || organization.country || "United States"
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.publicSlug!,
        summary:
          organization.tagline ??
          organization.description ??
          "View this organization's public Coach House profile.",
        location,
        delivery: organization.isOnlineOnly ? "Online" : "Local or hybrid",
        group: organization.primaryGroup,
        programCount: organization.programCount,
      }
    })
}
