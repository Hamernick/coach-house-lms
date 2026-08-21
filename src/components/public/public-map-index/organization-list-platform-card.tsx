"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PlatformOrganizationMapItem } from "@/lib/public-map/resource-map-items"
import { buildPublicImageTransformUrl } from "@/lib/storage/public-url"
import { cn } from "@/lib/utils"
import {
  buildPublicMapOrganizationListCardOwnerId,
  buildPublicMapOrganizationListCardOwnerProps,
  buildPublicMapOrganizationListCardSurfaceProps,
} from "./react-grab"
import {
  buildInitials,
  buildLocationMetadataItems,
  PUBLIC_MAP_LIST_CARD_HEIGHT_CLASSNAME,
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
  const categoryMetadataItems = buildLocationMetadataItems({
    primaryGroup: org.primaryGroup,
    isOnlineOnly: org.isOnlineOnly,
  })
  const fallbackInitials = buildInitials(org.name)
  const hasLogoImage = Boolean(org.logoUrl && org.logoUrl.trim().length > 0)
  const avatarImageSrc = buildPublicImageTransformUrl(
    org.logoUrl ?? org.headerUrl ?? undefined,
    {
      width: 144,
      height: 144,
      resize: hasLogoImage ? "contain" : "cover",
    }
  )
  const ownerId = buildPublicMapOrganizationListCardOwnerId(org.id)
  const openDetails = () =>
    onOpenDetails ? onOpenDetails(org.id) : onSelectOrg(org.id)

  return (
    <article
      key={org.id}
      style={PUBLIC_MAP_LIST_CARD_PERF_STYLE}
      className={cn(
        "group text-foreground relative w-full max-w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-transparent bg-transparent shadow-none transition-[border-color,background-color,color] outline-none",
        PUBLIC_MAP_LIST_CARD_HEIGHT_CLASSNAME,
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
          "relative z-10 flex h-full min-w-0 flex-col justify-center",
          constrainedLayout ? "p-3" : "p-4"
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
            constrainedLayout ? "gap-3" : "gap-4"
          )}
          {...buildPublicMapOrganizationListCardSurfaceProps({
            ownerId,
            slot: "identity-row",
            notes: "Top identity row containing the logo, title, and location.",
          })}
        >
          <Avatar
            className={cn(
              "border-border/60 mt-0.5 rounded-xl border",
              constrainedLayout ? "size-11" : "size-12",
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
            <AvatarFallback className="bg-muted/45 text-foreground rounded-xl text-xs font-semibold">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className="text-foreground truncate text-base leading-snug font-semibold"
              {...buildPublicMapOrganizationListCardSurfaceProps({
                ownerId,
                slot: "title",
                notes: "Organization name text block.",
              })}
            >
              {org.name}
            </p>
            <PublicMapListMetadataStrip
              itemKeyPrefix="category"
              items={categoryMetadataItems}
              notes="Primary category for the organization list card."
              ownerId={ownerId}
            />
          </div>
          <PublicMapListViewButton
            ownerId={ownerId}
            onClick={openDetails}
            notes="Explicit right-aligned call-to-action button for opening organization details."
          />
        </div>
      </div>
    </article>
  )
}
