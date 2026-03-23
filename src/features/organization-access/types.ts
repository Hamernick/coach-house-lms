export type { CoachHouseEmailPreview } from "./lib/email-foundation"
export type {
  OrganizationAccessRequestNotificationMetadata,
  OrganizationAccessRequestStatus,
  OrganizationAccessRole,
} from "./lib/notification-metadata"

export type OrganizationMemberRole =
  | "owner"
  | "admin"
  | "staff"
  | "board"
  | "member"

export type OrganizationAccessRequestRecordStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked"

export type OrganizationAccessRequest = {
  id: string
  orgId: string
  organizationName: string | null
  inviteeUserId: string
  inviteeEmail: string
  inviteeName: string | null
  inviterUserId: string | null
  inviterName: string | null
  role: OrganizationMemberRole
  status: OrganizationAccessRequestRecordStatus
  message: string | null
  createdAt: string
  respondedAt: string | null
  expiresAt: string
}
