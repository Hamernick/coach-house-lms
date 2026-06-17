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
] as const

export type OrganizationPrimaryObjectKind =
  (typeof ORGANIZATION_PRIMARY_OBJECT_KINDS)[number]

export const ORGANIZATION_PRIMARY_OBJECT_DEFINITIONS = [
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
    kind: "Campaign",
    description: "Fundraising or awareness push.",
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
  {
    kind: "Fundraiser",
    description: "Donation-oriented campaign, event, or appeal.",
  },
  {
    kind: "Grant application",
    description: "External funding request in preparation or review.",
  },
  {
    kind: "Re-grant request",
    description: "Money movement request after fiscal sponsorship approval.",
  },
] satisfies Array<{
  kind: OrganizationPrimaryObjectKind
  description: string
}>

export const ORGANIZATION_PRIMARY_OBJECT_SUMMARY =
  "Initiatives, projects, programs, events, campaigns, services, activities, fundraisers, grant applications, and re-grant requests."

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
