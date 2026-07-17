"use client"

import Link from "next/link"

import { Badge } from "@/features/platform-admin-dashboard"
import type { MemberWorkspaceAdminOrganizationSummary } from "../../types"

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function organizationStatusLabel(
  status: MemberWorkspaceAdminOrganizationSummary["organizationStatus"]
) {
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
  organization: MemberWorkspaceAdminOrganizationSummary
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
  const membersWithCompleteness = organization.members.filter(
    (member) => typeof member.profileCompletenessPercent === "number"
  )

  return (
    <div className="border-border bg-card/80 space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium">
          Organization
        </p>
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
            className="text-foreground text-sm font-medium underline-offset-2 hover:underline"
          >
            {organization.name}
          </Link>
        ) : (
          <p className="text-foreground text-sm font-medium">
            {organization.name}
          </p>
        )}
        {contact ? (
          <p className="text-muted-foreground text-xs">
            {contact.name}
            {contact.email ? ` · ${contact.email}` : ""}
          </p>
        ) : null}
      </div>

      <div className="border-border/70 space-y-2 border-t pt-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Organization setup</span>
          <span className="text-foreground font-medium">
            {organization.setupProgress}%
          </span>
        </div>
        <div
          className="bg-muted h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Organization setup completeness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={organization.setupProgress}
        >
          <div
            className="bg-primary h-full rounded-full"
            style={{ width: `${organization.setupProgress}%` }}
          />
        </div>
        <p className="text-muted-foreground text-[11px]">
          {organization.setupCompletedCount} of {organization.setupTotalCount}{" "}
          setup items complete
        </p>
      </div>

      {membersWithCompleteness.length > 0 ? (
        <div className="border-border/70 space-y-2 border-t pt-3">
          <p className="text-muted-foreground text-xs font-medium">
            User completeness
          </p>
          <div className="space-y-2">
            {membersWithCompleteness.map((member) => (
              <div key={member.userId} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-foreground min-w-0 truncate">
                    {member.name}
                  </span>
                  <span className="text-foreground shrink-0 font-medium">
                    {member.profileCompletenessPercent}%
                  </span>
                </div>
                {member.profileMissingFields?.length ? (
                  <p className="text-muted-foreground text-[11px] leading-4">
                    Missing {member.profileMissingFields.join(", ")}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-[11px]">
                    Profile complete
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
