import type {
  OrganizationAccessInvite,
  OrganizationMemberRole,
} from "@/app/actions/organization-access"

export const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  board: "Board",
  member: "Member",
}

export type OrganizationInviteRoleOption = OrganizationMemberRole | "funder"

export const INVITE_ROLE_LABELS: Record<OrganizationInviteRoleOption, string> = {
  ...ROLE_LABELS,
  funder: "Funder",
}

export const ROLE_HELP: Partial<Record<OrganizationInviteRoleOption, string>> = {
  admin: "Can manage access.",
  staff: "Can edit org settings.",
  board: "View-only access.",
  member: "Basic access.",
  funder: "Supporter/funder access.",
}

export const INVITEABLE_ROLES: OrganizationInviteRoleOption[] = [
  "staff",
  "board",
  "admin",
  "member",
  "funder",
]

export const MEMBER_EDITABLE_ROLES: OrganizationMemberRole[] = [
  "staff",
  "board",
  "admin",
  "member",
]

export function formatInviteRoleLabel(invite: Pick<OrganizationAccessInvite, "role" | "inviteKind">) {
  if (invite.inviteKind === "funder") return INVITE_ROLE_LABELS.funder
  return ROLE_LABELS[invite.role]
}

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
