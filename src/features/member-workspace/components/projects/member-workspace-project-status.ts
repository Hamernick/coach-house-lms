import type {
  PlatformAdminDashboardLabFiscalSponsorshipStatus,
  PlatformAdminDashboardLabStatus,
} from "@/features/platform-admin-dashboard"

export type MemberWorkspaceOrganizationStatus =
  | "onboarding"
  | "active"
  | "archived"

export const MEMBER_WORKSPACE_ORGANIZATION_STATUS_OPTIONS = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const satisfies ReadonlyArray<{
  value: MemberWorkspaceOrganizationStatus
  label: string
}>

export const MEMBER_WORKSPACE_FISCAL_SPONSORSHIP_STATUS_OPTIONS = [
  { value: "not_eligible", label: "Not Eligible" },
  { value: "eligible", label: "Eligible" },
  { value: "in_progress", label: "In Progress" },
  { value: "active", label: "Active" },
] as const satisfies ReadonlyArray<{
  value: PlatformAdminDashboardLabFiscalSponsorshipStatus
  label: string
}>

export function resolveMemberWorkspaceOrganizationStatus(
  status: PlatformAdminDashboardLabStatus
): MemberWorkspaceOrganizationStatus {
  if (status === "active") return "active"
  if (status === "completed" || status === "cancelled") return "archived"
  return "onboarding"
}

export function normalizeMemberWorkspaceOrganizationStatusFilterValue(
  value: string
): MemberWorkspaceOrganizationStatus | null {
  const normalized = value.trim().toLowerCase().replaceAll(" ", "_")
  if (normalized === "active") return "active"
  if (
    normalized === "archived" ||
    normalized === "completed" ||
    normalized === "cancelled"
  ) {
    return "archived"
  }
  if (
    normalized === "onboarding" ||
    normalized === "planned" ||
    normalized === "backlog"
  ) {
    return "onboarding"
  }
  return null
}

export function getMemberWorkspaceOrganizationStatusLabel(
  status: PlatformAdminDashboardLabStatus
) {
  const resolved = resolveMemberWorkspaceOrganizationStatus(status)
  return (
    MEMBER_WORKSPACE_ORGANIZATION_STATUS_OPTIONS.find(
      (option) => option.value === resolved
    )?.label ?? resolved
  )
}

export function getMemberWorkspaceFiscalSponsorshipStatusLabel(
  status: PlatformAdminDashboardLabFiscalSponsorshipStatus
) {
  return (
    MEMBER_WORKSPACE_FISCAL_SPONSORSHIP_STATUS_OPTIONS.find(
      (option) => option.value === status
    )?.label ?? status
  )
}
