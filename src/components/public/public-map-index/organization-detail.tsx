"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import {
} from "@/features/workspace-brand-kit"
import { resolveFormationStatusOption } from "@/lib/organization/formation-status"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  buildActionLinks,
  buildContactRows,
  buildInitials,
  buildSocialLinks,
  buildStoryFields,
  formatAddressLines,
  formatLocation,
  normalizeImageSrc,
  normalizeHref,
  normalizeText,
  resolveAboutText,
  resolveBrandKitDownloadHref,
  truncateAtWordBoundary,
} from "./organization-detail-helpers"
import {
  OrganizationDetailAddressSection,
  OrganizationDetailBrandKitSection,
  OrganizationDetailContactSection,
  OrganizationDetailFormationSection,
  OrganizationDetailOriginSection,
  OrganizationDetailProgramsSection,
} from "./organization-detail-sections"
import {
  OrganizationDetailAboutSection,
  OrganizationDetailActionLinks,
  OrganizationDetailIdentitySection,
  OrganizationDetailPanelChrome,
  OrganizationDetailSocialsSection,
} from "./organization-detail-shell-sections"

type PublicMapOrganizationDetailProps = {
  organization: PublicMapOrganization
  onBack: () => void
  onHidePanel: () => void
  compact?: boolean
}

export function PublicMapOrganizationDetail({
  organization,
  onBack,
  onHidePanel,
  compact = false,
}: PublicMapOrganizationDetailProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const [expandedStoryFields, setExpandedStoryFields] = useState<
    Record<string, boolean>
  >({})

  const profileImageSrc =
    normalizeImageSrc(organization.logoUrl) ??
    normalizeImageSrc(organization.headerUrl)
  const formationStatus = resolveFormationStatusOption(organization.formationStatus)
  const profileInitials = buildInitials(organization.name)
  const location = formatLocation(organization)
  const socials = buildSocialLinks(organization)
  const storyFields = buildStoryFields(organization)
  const contactRows = buildContactRows(organization)
  const addressLines = formatAddressLines(organization)
  const resourceHref = normalizeHref(organization.locationUrl) ?? normalizeHref(organization.website)
  const aboutText = resolveAboutText(organization)
  const aboutNeedsToggle = aboutText.length > 280
  const aboutCopy = aboutExpanded
    ? aboutText
    : truncateAtWordBoundary(aboutText, 280)
  const actionLinks = buildActionLinks(organization)
  const brandKitDownloadHref = resolveBrandKitDownloadHref(organization)

  return (
    <div
      className={cn(
        "space-y-3 border-b border-border/60 bg-transparent pt-3 text-card-foreground",
        compact
          ? "px-1.5 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
          : "px-2 pb-3",
      )}
    >
      <OrganizationDetailPanelChrome
        organization={organization}
        onBack={onBack}
        onHidePanel={onHidePanel}
      />

      <OrganizationDetailIdentitySection
        organization={organization}
        profileImageSrc={profileImageSrc}
        profileInitials={profileInitials}
        location={location}
      />

      <OrganizationDetailActionLinks actionLinks={actionLinks} />

      <OrganizationDetailAboutSection
        aboutCopy={aboutCopy}
        aboutExpanded={aboutExpanded}
        aboutNeedsToggle={aboutNeedsToggle}
        onToggle={() => setAboutExpanded((previous) => !previous)}
      />

      <OrganizationDetailFormationSection formationStatus={formationStatus} />

      <OrganizationDetailSocialsSection socials={socials} />

      <OrganizationDetailBrandKitSection
        organization={organization}
        brandKitDownloadHref={brandKitDownloadHref}
      />

      <OrganizationDetailOriginSection
        storyFields={storyFields}
        expandedStoryFields={expandedStoryFields}
        onToggleField={(fieldLabel) =>
          setExpandedStoryFields((previous) => ({
            ...previous,
            [fieldLabel]: !previous[fieldLabel],
          }))
        }
      />

      <OrganizationDetailContactSection contactRows={contactRows} />

      <OrganizationDetailAddressSection
        addressLines={addressLines}
        isOnlineOnly={organization.isOnlineOnly}
        resourceHref={resourceHref}
      />

      <OrganizationDetailProgramsSection programs={organization.programs} />
    </div>
  )
}
