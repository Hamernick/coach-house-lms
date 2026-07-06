"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCompactOrganizationLocation } from "@/lib/location/organization-location"
import type { PlatformOrganizationMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import { OrganizationListActivityPreview } from "./organization-list-activity-preview"
import {
  buildPublicMapOrganizationListCardOwnerId,
  buildPublicMapOrganizationListCardOwnerProps,
  buildPublicMapOrganizationListCardSurfaceProps,
} from "./react-grab"
import {
  buildInitials,
  buildLocationMetadataItems,
  buildProgramPreviewCards,
  PUBLIC_MAP_LIST_CARD_PERF_STYLE,
  PublicMapListMetadataStrip,
  PublicMapListViewButton,
} from "./organization-list-card-shared"

export function PublicMapPlatformOrganizationListCard({
  constrainedLayout,
  item,
  selected,
  onOpenDetails,
  onSelectOrg,
}: {
  constrainedLayout: boolean
  item: PlatformOrganizationMapItem
  selected: boolean
  onOpenDetails?: (id: string) => void
  onSelectOrg: (id: string) => void
}) {
  const org = item.organization
  const location = formatCompactOrganizationLocation({
    city: org.city,
    state: org.state,
    country: org.country,
  })
  const locationMetadataItems = buildLocationMetadataItems({
    location,
    primaryGroup: org.primaryGroup,
    isOnlineOnly: org.isOnlineOnly,
    constrainedLayout,
  })
  const previewPrograms = buildProgramPreviewCards(org)
  const visiblePreviewPrograms = constrainedLayout
    ? previewPrograms.slice(0, 2)
    : previewPrograms
  const fallbackInitials = buildInitials(org.name)
  const avatarImageSrc = org.logoUrl ?? org.headerUrl ?? undefined
  const hasLogoImage = Boolean(org.logoUrl && org.logoUrl.trim().length > 0)
  const ownerId = buildPublicMapOrganizationListCardOwnerId(org.id)
  const openDetails = () =>
    onOpenDetails ? onOpenDetails(org.id) : onSelectOrg(org.id)

  return (
    <article
      key={org.id}
      style={PUBLIC_MAP_LIST_CARD_PERF_STYLE}
      className={cn(
        "group text-foreground relative w-full max-w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-transparent bg-transparent shadow-none transition-[border-color,background-color,color] outline-none",
        "focus-within:border-border/80 focus-within:bg-accent focus-within:text-accent-foreground dark:focus-within:bg-accent/50",
        "focus-visible:border-border/80 focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-ring/35 dark:focus-visible:bg-accent/50 focus-visible:ring-2",
        "motion-reduce:transition-none",
        selected
          ? "border-primary/35 bg-accent text-accent-foreground dark:bg-accent/50"
          : "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${org.name}`}
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        openDetails()
      }}
      {...buildPublicMapOrganizationListCardOwnerProps({
        ownerId,
        slot: "card",
        notes:
          "Clicking the non-action parts of the card opens the organization detail panel.",
      })}
    >
      <div
        className={cn(
          "relative z-10 flex min-w-0 flex-col",
          constrainedLayout ? "gap-2.5 p-2.5" : "gap-3 p-3"
        )}
        {...buildPublicMapOrganizationListCardSurfaceProps({
          ownerId,
          slot: "body",
          surfaceKind: "content",
          notes:
            "Primary content stack for the public map organization list card.",
        })}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            constrainedLayout ? "gap-2.5" : "gap-3"
          )}
          {...buildPublicMapOrganizationListCardSurfaceProps({
            ownerId,
            slot: "identity-row",
            notes: "Top identity row containing the logo, title, and location.",
          })}
        >
          <Avatar
            className={cn(
              "border-border/60 mt-0.5 size-10 rounded-xl border",
              hasLogoImage && "bg-white"
            )}
            {...buildPublicMapOrganizationListCardSurfaceProps({
              ownerId,
              slot: "avatar",
              notes: "Organization logo or fallback avatar surface.",
            })}
          >
            <AvatarImage
              src={avatarImageSrc}
              alt={org.name}
              className={cn(
                hasLogoImage ? "object-contain p-1.5" : "object-cover"
              )}
            />
            <AvatarFallback className="bg-muted/45 text-foreground rounded-xl text-[11px] font-semibold">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className="text-foreground line-clamp-2 text-[15px] leading-tight font-semibold"
              {...buildPublicMapOrganizationListCardSurfaceProps({
                ownerId,
                slot: "title",
                notes: "Organization name text block.",
              })}
            >
              {org.name}
            </p>
            <PublicMapListMetadataStrip
              itemKeyPrefix="location"
              items={locationMetadataItems}
              notes="Inline metadata strip for the organization list card."
              ownerId={ownerId}
            />
          </div>
          <PublicMapListViewButton
            ownerId={ownerId}
            onClick={openDetails}
            notes="Explicit right-aligned call-to-action button for opening organization details."
          />
        </div>

        <OrganizationListActivityPreview
          constrainedLayout={constrainedLayout}
          ownerId={ownerId}
          previewPrograms={visiblePreviewPrograms}
          programPreview={org.programPreview}
        />
      </div>
    </article>
  )
}
