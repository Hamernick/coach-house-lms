import type {
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabStatus,
} from "@/features/platform-admin-dashboard"

export function resolveAdminOrganizationProjectStatus({
  organizationStatus,
  setupProgress,
}: {
  organizationStatus: "pending" | "approved" | "n/a"
  setupProgress: number
}): PlatformAdminDashboardLabStatus {
  if (setupProgress >= 100) return "completed"
  if (organizationStatus === "approved" || setupProgress >= 65) return "active"
  if (organizationStatus === "pending" || setupProgress >= 35) return "planned"
  return "backlog"
}

export function resolveAdminOrganizationProjectPriority(
  setupProgress: number
): PlatformAdminDashboardLabPriority {
  if (setupProgress < 35) return "urgent"
  if (setupProgress < 60) return "high"
  if (setupProgress < 85) return "medium"
  return "low"
}
