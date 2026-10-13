import type { OrganizationMemberRole } from "@/app/actions/organization-access"

export const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  board: "Board",
  member: "Member",
}

export const ROLE_HELP: Partial<Record<OrganizationMemberRole, string>> = {
  admin: "Can manage access.",
  staff: "Can edit org settings.",
  board: "View-only access.",
  member: "Basic access.",
}

export const INVITEABLE_ROLES: OrganizationMemberRole[] = [
  "staff",
  "board",
  "admin",
  "member",
]

export function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return value
  }
}

export async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  if (typeof window !== "undefined") {
    window.prompt("Copy this link:", text)
  }
}
