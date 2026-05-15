"use client"

import Link from "next/link"

import { Badge } from "@/features/platform-admin-dashboard"
import type { MemberWorkspaceAdminOrganizationSummary } from "../../types"

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function organizationStatusLabel(status: MemberWorkspaceAdminOrganizationSummary["organizationStatus"]) {
  if (status === "approved") return "Approved"
  if (status === "pending") return "Pending"
  return "N/A"
}

function resolveExternalHref(value: unknown) {
  const href = toTrimmedString(value)
  if (!href) return null
  if (href.startsWith("/")) return href
  if (/^https?:\/\//i.test(href)) return href
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(href)) {
    return `https://${href}`
  }
  return null
}

export function resolveMemberWorkspaceOrganizationHref(
  organization: MemberWorkspaceAdminOrganizationSummary,
) {
  const website =
    resolveExternalHref(organization.profile.website) ||
    resolveExternalHref(organization.profile.publicUrl) ||
    resolveExternalHref(organization.profile.public_url)

  if (website) return website

  const publicSlug = toTrimmedString(organization.publicSlug)
  return publicSlug ? `/find/${encodeURIComponent(publicSlug)}` : null
}

export function MemberWorkspaceProjectOrganizationCard({
  organization,
}: {
  organization: MemberWorkspaceAdminOrganizationSummary
}) {
  const contact =
    organization.members.find((member) => member.isOwner) ??
    organization.members[0] ??
    null
  const href = resolveMemberWorkspaceOrganizationHref(organization)

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Organization</p>
        <Badge
          variant="outline"
          className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
        >
          {organizationStatusLabel(organization.organizationStatus)}
        </Badge>
      </div>
      <div className="space-y-1">
        {href ? (
          <Link
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
          >
            {organization.name}
          </Link>
        ) : (
          <p className="text-sm font-medium text-foreground">{organization.name}</p>
        )}
        {contact ? (
          <p className="text-xs text-muted-foreground">
            {contact.name}
            {contact.email ? ` · ${contact.email}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  )
}
