export const ORGANIZATION_PRIMARY_OBJECT_KINDS = [
  "Initiative",
  "Project",
  "Program",
  "Event",
  "Campaign",
  "Service",
  "Activity",
  "Fundraiser",
  "Grant application",
  "Re-grant request",
  "Web resource",
] as const

export type OrganizationPrimaryObjectKind =
  (typeof ORGANIZATION_PRIMARY_OBJECT_KINDS)[number]

export const ORGANIZATION_ACTIVITY_KINDS = [
  "Initiative",
  "Project",
  "Program",
  "Event",
  "Service",
  "Activity",
  "Web resource",
] as const

export type OrganizationActivityKind =
  (typeof ORGANIZATION_ACTIVITY_KINDS)[number]

type OrganizationObjectDefinition<TKind extends string> = {
  kind: TKind
  description: string
}

const ORGANIZATION_SHARED_ACTIVITY_DEFINITIONS = [
  {
    kind: "Initiative",
    description: "Umbrella body of work that can contain projects or programs.",
  },
  {
    kind: "Project",
    description: "Umbrella initiative with a defined outcome or operating arc.",
  },
  {
    kind: "Program",
    description: "Recurring or ongoing charitable work.",
  },
  {
    kind: "Event",
    description: "Dated public activity.",
  },
  {
    kind: "Service",
    description: "Charitable service delivered to people or communities.",
  },
  {
    kind: "Activity",
    description:
      "Smaller operating activity connected to a program or project.",
  },
] satisfies Array<
  OrganizationObjectDefinition<
    Exclude<OrganizationActivityKind, "Web resource">
  >
>

const ORGANIZATION_CAMPAIGN_DEFINITION = {
  kind: "Campaign",
  description: "Fundraising or awareness push.",
} satisfies OrganizationObjectDefinition<"Campaign">

const ORGANIZATION_FUNDRAISER_DEFINITION = {
  kind: "Fundraiser",
  description: "Donation-oriented campaign, event, or appeal.",
} satisfies OrganizationObjectDefinition<"Fundraiser">

const ORGANIZATION_GRANT_WORKFLOW_DEFINITIONS = [
  {
    kind: "Grant application",
    description: "External funding request in preparation or review.",
  },
  {
    kind: "Re-grant request",
    description: "Money movement request after fiscal sponsorship approval.",
  },
] satisfies Array<
  OrganizationObjectDefinition<
    Extract<
      OrganizationPrimaryObjectKind,
      "Grant application" | "Re-grant request"
    >
  >
>

const ORGANIZATION_WEB_RESOURCE_DEFINITION = {
  kind: "Web resource",
  description: "Online resource, guide, toolkit, or public information hub.",
} satisfies OrganizationObjectDefinition<"Web resource">

export const ORGANIZATION_PRIMARY_OBJECT_DEFINITIONS = [
  ...ORGANIZATION_SHARED_ACTIVITY_DEFINITIONS.slice(0, 4),
  ORGANIZATION_CAMPAIGN_DEFINITION,
  ...ORGANIZATION_SHARED_ACTIVITY_DEFINITIONS.slice(4),
  ORGANIZATION_FUNDRAISER_DEFINITION,
  ...ORGANIZATION_GRANT_WORKFLOW_DEFINITIONS,
  ORGANIZATION_WEB_RESOURCE_DEFINITION,
] satisfies Array<OrganizationObjectDefinition<OrganizationPrimaryObjectKind>>

export const ORGANIZATION_ACTIVITY_KIND_DEFINITIONS = [
  ...ORGANIZATION_SHARED_ACTIVITY_DEFINITIONS,
  ORGANIZATION_WEB_RESOURCE_DEFINITION,
] satisfies Array<OrganizationObjectDefinition<OrganizationActivityKind>>

export const ORGANIZATION_PRIMARY_OBJECT_SUMMARY =
  "Initiatives, projects, programs, events, campaigns, services, activities, fundraisers, grant applications, re-grant requests, and web resources."

export const ORGANIZATION_ACTIVITY_KIND_SUMMARY =
  "initiatives, projects, programs, events, services, activities, and web resources."

export function isOrganizationPrimaryObjectKind(
  value: unknown
): value is OrganizationPrimaryObjectKind {
  return ORGANIZATION_PRIMARY_OBJECT_KINDS.includes(
    value as OrganizationPrimaryObjectKind
  )
}

export function resolveOrganizationPrimaryObjectKind(
  value: unknown
): OrganizationPrimaryObjectKind {
  return isOrganizationPrimaryObjectKind(value) ? value : "Program"
}

export function isOrganizationActivityKind(
  value: unknown
): value is OrganizationActivityKind {
  return ORGANIZATION_ACTIVITY_KINDS.includes(value as OrganizationActivityKind)
}

export function resolveOrganizationActivityKind(
  value: unknown
): OrganizationActivityKind {
  return isOrganizationActivityKind(value) ? value : "Program"
}
