"use client"

import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import type { OrganizationAccessRequest } from "@/app/actions/organization-access"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, ROLE_LABELS } from "./organization-access-manager-helpers"

function resolveStatusLabel(status: OrganizationAccessRequest["status"]) {
  if (status === "accepted") return "Accepted"
  if (status === "declined") return "Declined"
  if (status === "expired") return "Expired"
  if (status === "revoked") return "Revoked"
  return "Pending"
}

function resolveStatusTone(status: OrganizationAccessRequest["status"]) {
  if (status === "accepted") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
  if (status === "declined") return "border-amber-500/30 bg-amber-500/10 text-amber-700"
  if (status === "expired" || status === "revoked") {
    return "border-border/60 bg-muted/60 text-muted-foreground"
  }
  return "border-sky-500/30 bg-sky-500/10 text-sky-700"
}

export function OrganizationAccessRequestsList({
  requests,
  pending,
  onRevokeRequest,
}: {
  requests: OrganizationAccessRequest[]
  pending: boolean
  onRevokeRequest: (requestId: string) => void
}) {
  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                {request.inviteeName?.trim() || request.inviteeEmail}
              </p>
              <Badge
                variant="outline"
                className={resolveStatusTone(request.status)}
              >
                {resolveStatusLabel(request.status)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {ROLE_LABELS[request.role]} access
              {request.organizationName ? ` • ${request.organizationName}` : ""}
              {request.inviterName ? ` • Sent by ${request.inviterName}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Expires {formatDate(request.expiresAt)}
            </p>
          </div>
          {request.status === "pending" ? (
            <div className="flex items-center gap-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onRevokeRequest(request.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon className="h-4 w-4" aria-hidden />
                Revoke
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
