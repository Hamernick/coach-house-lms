import type { OrganizationCoachOption } from "../types"

export function getOrganizationCoachInitials(coach: OrganizationCoachOption) {
  return coach.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
