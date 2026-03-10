import type { OrganizationMemberRole } from "@/app/actions/organization-access"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceCollaborationInviteStatus,
  WorkspaceDurationUnit,
} from "./workspace-board-types"

export type WorkspaceInviteAudience = "team" | "temporary"
export type WorkspaceInviteAccessLevel = "viewer" | "editor"

export function formatDuration(value: number, unit: WorkspaceDurationUnit) {
  const label = value === 1 ? unit.slice(0, -1) : unit
  return `${value} ${label}`
}

export function clampDurationValue(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(12, Math.round(value)))
}

export function formatRemaining(expiresAt: string) {
  const expiry = new Date(expiresAt).getTime()
  if (!Number.isFinite(expiry)) return "Expires soon"
  const remainingMs = Math.max(0, expiry - Date.now())

  const hours = Math.floor(remainingMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d left`
  if (hours > 0) return `${hours}h left`
  const minutes = Math.floor(remainingMs / (1000 * 60))
  return `${Math.max(1, minutes)}m left`
}

export function resolveInviteStatus(
  invite: WorkspaceCollaborationInvite,
  nowMs: number,
): WorkspaceCollaborationInviteStatus {
  if (invite.revokedAt) return "revoked"
  const expiry = new Date(invite.expiresAt).getTime()
  if (!Number.isFinite(expiry) || expiry <= nowMs) return "expired"
  return "active"
}

export function formatTimestamp(value: string | null) {
  if (!value) return "Unknown time"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown time"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function statusTone(status: WorkspaceCollaborationInviteStatus) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === "expired") return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "bg-muted text-muted-foreground"
}

export function statusLabel(status: WorkspaceCollaborationInviteStatus) {
  if (status === "active") return "Active"
  if (status === "expired") return "Expired"
  return "Revoked"
}

export function resolveWorkspaceTeamInviteRole(
  level: WorkspaceInviteAccessLevel,
): OrganizationMemberRole {
  return level === "viewer" ? "board" : "staff"
}

export function isWorkspaceInviteAccessAvailable(
  audience: WorkspaceInviteAudience,
  level: WorkspaceInviteAccessLevel,
) {
  return audience === "team" || level === "editor"
}

export function resolveWorkspaceInviteAccessCopy(
  audience: WorkspaceInviteAudience,
  level: WorkspaceInviteAccessLevel,
) {
  if (audience === "team") {
    return level === "viewer"
      ? {
          title: "Viewer access",
          description: "Read-only organization access. Invites map to the Board role.",
        }
      : {
          title: "Editor access",
          description: "Can update workspace and organization details. Invites map to the Staff role.",
        }
  }

  return level === "viewer"
    ? {
        title: "Temporary viewer access unavailable",
        description: "Use Team and choose Viewer for read-only access. Temporary invites currently grant editor collaboration only.",
      }
    : {
        title: "Temporary editor access",
        description: "Grant timed live workspace collaboration to an existing teammate.",
      }
}
