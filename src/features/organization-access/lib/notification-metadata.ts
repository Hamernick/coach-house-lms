export type OrganizationAccessRole = "owner" | "admin" | "staff" | "board" | "member"

export type OrganizationAccessRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked"

export const ORGANIZATION_ACCESS_REQUEST_NOTIFICATION_TYPE =
  "organization_access_request"

export type OrganizationAccessRequestNotificationMetadata = {
  requestId: string
  role: OrganizationAccessRole
  organizationName: string
  inviterName: string | null
  status: OrganizationAccessRequestStatus
}

export function formatOrganizationAccessRoleLabel(role: OrganizationAccessRole) {
  if (role === "owner") return "Owner"
  if (role === "admin") return "Admin"
  if (role === "staff") return "Staff"
  if (role === "board") return "Board"
  return "Member"
}

export function buildOrganizationAccessRequestNotificationMetadata(
  metadata: OrganizationAccessRequestNotificationMetadata,
) {
  return metadata
}

export function readOrganizationAccessRequestNotificationMetadata(
  value: unknown,
): OrganizationAccessRequestNotificationMetadata | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const requestId =
    typeof record.requestId === "string" && record.requestId.trim().length > 0
      ? record.requestId.trim()
      : null
  const organizationName =
    typeof record.organizationName === "string" &&
    record.organizationName.trim().length > 0
      ? record.organizationName.trim()
      : null
  const inviterName =
    typeof record.inviterName === "string" && record.inviterName.trim().length > 0
      ? record.inviterName.trim()
      : null
  const role = record.role
  const status = record.status

  if (
    !requestId ||
    !organizationName ||
    (role !== "owner" &&
      role !== "admin" &&
      role !== "staff" &&
      role !== "board" &&
      role !== "member") ||
    (status !== "pending" &&
      status !== "accepted" &&
      status !== "declined" &&
      status !== "expired" &&
      status !== "revoked")
  ) {
    return null
  }

  return {
    requestId,
    role,
    organizationName,
    inviterName,
    status,
  }
}
