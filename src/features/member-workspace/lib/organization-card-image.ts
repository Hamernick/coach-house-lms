import type { MemberWorkspaceAdminOrganizationSummary } from "../types"

function imageUrl(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function resolveOrganizationCardImage(
  organization: Pick<MemberWorkspaceAdminOrganizationSummary, "profile" | "ownerAvatarUrl" | "members">
): string | null {
  const logo = imageUrl(organization.profile.logoUrl)
  if (!logo) return null
  // Legacy onboarding copied the creator's avatar into an empty logoUrl.
  // A known personal photo is not an organization image, even in that field.
  const people = Array.isArray(organization.profile.org_people)
    ? organization.profile.org_people : []
  const personalImages = [
    organization.ownerAvatarUrl,
    ...organization.members.map((member) => member.avatarUrl),
    ...people.map((person) => person && typeof person === "object" ? person.image : null),
  ]
  return personalImages.some((image) => imageUrl(image) === logo) ? null : logo
}
