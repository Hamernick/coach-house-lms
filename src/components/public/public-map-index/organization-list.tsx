"use client"

import { memo, useMemo } from "react"
import HeartIcon from "lucide-react/dist/esm/icons/heart"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCompactOrganizationLocation } from "@/lib/location/organization-location"
import { PUBLIC_MAP_GROUP_LABELS } from "@/lib/public-map/groups"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { PublicMapMediaImage } from "./media-image"
import {
  buildPublicMapOrganizationListCardOwnerId,
  buildPublicMapOrganizationListCardOwnerProps,
  buildPublicMapOrganizationListCardSurfaceProps,
} from "./react-grab"
import {
  PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_MEDIA_SURFACE_CLASSNAME,
} from "./sidebar-theme"

const PUBLIC_MAP_LIST_CARD_PERF_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "308px",
} as const

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "O"
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

function buildProgramPreviewCards(org: PublicMapOrganization) {
  return org.programs
    .filter((program) =>
      Boolean(program.imageUrl && program.imageUrl.trim().length > 0)
    )
    .slice(0, 3)
}

function buildLocationMetadataItems({
  location,
  primaryGroup,
  isOnlineOnly,
  constrainedLayout,
}: {
  location: string
  primaryGroup: PublicMapOrganization["primaryGroup"]
  isOnlineOnly: boolean
  constrainedLayout: boolean
}) {
  const items = [
    location,
    isOnlineOnly ? "Web resource" : null,
    PUBLIC_MAP_GROUP_LABELS[primaryGroup],
  ].filter((item): item is string => Boolean(item && item.trim().length > 0))

  const maxItems = constrainedLayout ? 2 : 3
  return items.slice(0, maxItems)
}

function PublicMapOrganizationListComponent({
  organizations,
  selectedOrgId,
  favorites,
  query,
  constrainedLayout = false,
  onSelectOrg,
  onToggleFavorite,
  onOpenDetails,
}: {
  organizations: PublicMapOrganization[]
  selectedOrgId: string | null
  favorites: string[]
  query?: string
  constrainedLayout?: boolean
  onSelectOrg: (id: string) => void
  onToggleFavorite: (id: string) => void
  onOpenDetails?: (id: string) => void
}) {
  const favoriteIds = useMemo(() => new Set(favorites), [favorites])

  if (organizations.length === 0) {
    const hasSearchQuery = Boolean(query?.trim().length)
    return (
      <div
        className={cn(
          "flex flex-col gap-1 px-4 py-6 text-center",
          PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME
        )}
      >
        <p className="text-foreground text-sm font-medium">
          No organizations yet
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {hasSearchQuery
            ? "No organizations matched your search."
            : "Public organizations will appear here once they are published. Map markers appear when an address is available."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-2.5">
      {organizations.map((org) => {
        const selected = selectedOrgId === org.id
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
        const isFavorite = favoriteIds.has(org.id)
        const previewPrograms = buildProgramPreviewCards(org)
        const visiblePreviewPrograms = constrainedLayout
          ? previewPrograms.slice(0, 2)
          : previewPrograms
        const fallbackInitials = buildInitials(org.name)
        const avatarImageSrc = org.logoUrl ?? org.headerUrl ?? undefined
        const hasLogoImage = Boolean(
          org.logoUrl && org.logoUrl.trim().length > 0
        )
        const ownerId = buildPublicMapOrganizationListCardOwnerId(org.id)
        const openDetails = () =>
          onOpenDetails ? onOpenDetails(org.id) : onSelectOrg(org.id)

        return (
          <article
            key={org.id}
            style={PUBLIC_MAP_LIST_CARD_PERF_STYLE}
            className={cn(
              "group relative w-full max-w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-transparent bg-transparent shadow-none transition-[border-color,background-color,box-shadow] outline-none",
              "focus-within:border-border/80 focus-within:bg-sidebar-accent/75 focus-within:shadow-sm",
              "focus-visible:border-border/80 focus-visible:bg-sidebar-accent/75 focus-visible:ring-ring/35 focus-visible:shadow-sm focus-visible:ring-2",
              "motion-reduce:transition-none",
              selected
                ? "border-primary/35 bg-sidebar-accent/90 shadow-sm"
                : "hover:border-border/80 hover:bg-sidebar-accent/70 hover:shadow-sm"
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "pointer-events-auto absolute z-20",
                constrainedLayout ? "top-2.5 right-2.5" : "top-3 right-3",
                "size-8 rounded-full transition-colors",
                PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
                isFavorite
                  ? "border-sky-400/55 bg-sky-500/12 text-sky-600 hover:bg-sky-500/18 dark:border-sky-400/45 dark:bg-sky-400/14 dark:text-sky-300 dark:hover:bg-sky-400/20"
                  : "text-muted-foreground"
              )}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onToggleFavorite(org.id)
              }}
              aria-label={
                isFavorite
                  ? `Remove ${org.name} from favorites`
                  : `Add ${org.name} to favorites`
              }
              aria-pressed={isFavorite}
              {...buildPublicMapOrganizationListCardSurfaceProps({
                ownerId,
                slot: "favorite-button",
                surfaceKind: "trigger",
                notes:
                  "Saves or unsaves the organization from the map favorites rail.",
              })}
            >
              <HeartIcon
                className={cn(isFavorite && "fill-current")}
                aria-hidden
              />
            </Button>

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
                  "flex min-w-0 items-start pr-11",
                  constrainedLayout ? "gap-2.5" : "gap-3"
                )}
                {...buildPublicMapOrganizationListCardSurfaceProps({
                  ownerId,
                  slot: "identity-row",
                  notes:
                    "Top identity row containing the logo, title, and location.",
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
                  <div
                    className="text-muted-foreground mt-1.5 flex max-w-full items-center gap-2 text-xs"
                    {...buildPublicMapOrganizationListCardSurfaceProps({
                      ownerId,
                      slot: "meta-row",
                      notes:
                        "Inline metadata strip with the detail action for the organization list card.",
                    })}
                  >
                    <div
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5"
                      {...buildPublicMapOrganizationListCardSurfaceProps({
                        ownerId,
                        slot: "location",
                        notes:
                          "Resolved inline metadata strip for the organization list card.",
                      })}
                    >
                      {locationMetadataItems.map((item, index) => (
                        <span
                          key={`location-meta-${index}`}
                          className={cn(
                            "inline-flex min-w-0 items-center",
                            index === 0 && "max-w-full"
                          )}
                        >
                          {index > 0 ? (
                            <span
                              aria-hidden
                              className="text-muted-foreground/70 mr-1.5"
                            >
                              •
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "min-w-0",
                              index === 0 ? "truncate" : "whitespace-nowrap"
                            )}
                          >
                            {item}
                          </span>
                        </span>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className={cn(
                        "pointer-events-auto relative z-20 h-auto shrink-0 px-0 py-0 text-[12px] font-medium text-[#06c] no-underline shadow-none",
                        "transition-colors duration-150 ease-out motion-reduce:transition-none",
                        "group-focus-within:text-[#0077ed] group-hover:text-[#0077ed]",
                        "hover:bg-transparent hover:text-[#0077ed] hover:no-underline",
                        "focus-visible:bg-transparent focus-visible:text-[#0077ed] focus-visible:no-underline"
                      )}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation()
                        openDetails()
                      }}
                      {...buildPublicMapOrganizationListCardSurfaceProps({
                        ownerId,
                        slot: "view-button",
                        surfaceKind: "trigger",
                        notes:
                          "Explicit call-to-action button for opening organization details.",
                      })}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>

              {org.programPreview?.title ? (
                <div
                  className="border-border/70 bg-card/80 relative z-10 min-w-0 rounded-xl border px-2.5 py-2"
                  {...buildPublicMapOrganizationListCardSurfaceProps({
                    ownerId,
                    slot: "featured-program",
                    notes:
                      "Featured program summary card shown above the preview grid.",
                  })}
                >
                  <p className="text-foreground line-clamp-1 text-xs font-medium">
                    {org.programPreview.title}
                  </p>
                  {org.programPreview.subtitle ? (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                      {org.programPreview.subtitle}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {visiblePreviewPrograms.length > 0 ? (
                <div
                  className={cn(
                    "relative z-10 grid gap-1.5",
                    constrainedLayout
                      ? "grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3"
                  )}
                  {...buildPublicMapOrganizationListCardSurfaceProps({
                    ownerId,
                    slot: "program-preview-grid",
                    notes:
                      "Responsive grid of public program preview media cards.",
                  })}
                >
                  {visiblePreviewPrograms.map((program) => (
                    <div
                      key={`${org.id}:program:${program.id}`}
                      className={cn(
                        "overflow-hidden rounded-lg",
                        PUBLIC_MAP_SIDEBAR_MEDIA_SURFACE_CLASSNAME
                      )}
                      {...buildPublicMapOrganizationListCardSurfaceProps({
                        ownerId,
                        slot: "program-preview-card",
                        notes:
                          "Individual preview card within the organization program media grid.",
                      })}
                    >
                      <PublicMapMediaImage
                        src={program.imageUrl ?? ""}
                        alt=""
                        wrapperClassName={cn(
                          "bg-muted/30",
                          constrainedLayout ? "h-[4.5rem]" : "h-20"
                        )}
                      />
                      <div className="px-2 py-1.5">
                        <p className="text-foreground line-clamp-1 text-[11px] font-medium">
                          {program.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export const PublicMapOrganizationList = memo(
  PublicMapOrganizationListComponent
)
