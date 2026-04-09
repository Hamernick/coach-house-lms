"use client"

import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import GlobeIcon from "lucide-react/dist/esm/icons/globe"
import HeartIcon from "lucide-react/dist/esm/icons/heart"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PUBLIC_MAP_GROUP_LABELS } from "@/lib/public-map/groups"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { PublicMapMediaImage } from "./media-image"

const PUBLIC_MAP_LIST_CARD_PERF_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "308px",
} as const

function formatLocation(org: PublicMapOrganization) {
  return [org.city, org.state, org.country]
    .filter((entry) => Boolean(entry && entry.trim().length > 0))
    .join(", ")
}

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "O"
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

function buildProgramPreviewCards(org: PublicMapOrganization) {
  return org.programs
    .filter((program) => Boolean(program.imageUrl && program.imageUrl.trim().length > 0))
    .slice(0, 3)
}

export function PublicMapOrganizationList({
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
  if (organizations.length === 0) {
    const hasSearchQuery = Boolean(query?.trim().length)
    return (
      <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-5 text-center">
        <p className="text-sm font-medium text-foreground">No organizations yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasSearchQuery
            ? "No organizations matched your search."
            : "Public organizations will appear here once they are published. Map markers appear when an address is available."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {organizations.map((org) => {
        const selected = selectedOrgId === org.id
        const location = formatLocation(org)
        const isFavorite = favorites.includes(org.id)
        const previewPrograms = buildProgramPreviewCards(org)
        const fallbackInitials = buildInitials(org.name)

        return (
          <article
            key={org.id}
            style={PUBLIC_MAP_LIST_CARD_PERF_STYLE}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-background/85 p-3 transition-colors",
              selected
                ? "bg-card"
                : "hover:bg-background",
            )}
          >
            <Button
              type="button"
              variant="ghost"
              className="absolute inset-0 z-0 h-auto w-auto rounded-[inherit] border border-white/15 bg-background/25 p-0 text-transparent shadow-none transition-colors hover:bg-background/35 dark:border-white/30 dark:bg-white/12 dark:hover:bg-white/18 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => (onOpenDetails ? onOpenDetails(org.id) : onSelectOrg(org.id))}
              aria-label={`Open details for ${org.name}`}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "pointer-events-auto absolute z-20",
                constrainedLayout ? "right-2.5 top-2.5" : "right-3 top-3",
                "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                isFavorite
                  ? "border-primary/45 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/80 text-muted-foreground hover:bg-muted",
              )}
              onClick={() => onToggleFavorite(org.id)}
              aria-label={isFavorite ? `Remove ${org.name} from favorites` : `Add ${org.name} to favorites`}
            >
              <HeartIcon className={cn("h-4 w-4", isFavorite && "fill-current")} aria-hidden />
            </Button>

            <div
              className={cn(
                "pointer-events-none relative z-10 flex min-w-0 items-start pr-10",
                constrainedLayout ? "gap-2.5" : "gap-3",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none min-w-0 flex flex-1 items-start",
                  constrainedLayout ? "gap-2.5" : "gap-3",
                )}
              >
                <Avatar className="mt-0.5 size-10 rounded-xl border border-border/60">
                  <AvatarImage src={org.logoUrl ?? org.headerUrl ?? undefined} alt={org.name} className="object-cover" />
                  <AvatarFallback className="rounded-xl bg-muted/45 text-[11px] font-semibold text-foreground">
                    {fallbackInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-foreground">{org.name}</span>
                  {org.tagline ? (
                    <span className="mt-0.5 block line-clamp-3 min-w-0 break-words text-xs leading-relaxed text-muted-foreground">
                      {org.tagline}
                    </span>
                  ) : null}
                  {location ? (
                    <span className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{location}</span>
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            {org.programPreview?.title ? (
              <div className="pointer-events-none relative z-10 mt-2 rounded-xl border border-border/70 bg-card/80 px-2.5 py-2">
                <p className="line-clamp-1 text-xs font-medium text-foreground">{org.programPreview.title}</p>
                {org.programPreview.subtitle ? (
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">{org.programPreview.subtitle}</p>
                ) : null}
              </div>
            ) : null}

            {previewPrograms.length > 0 ? (
              <div className="pointer-events-none relative z-10 mt-2 grid grid-cols-3 gap-1.5">
                {previewPrograms.map((program) => (
                  <div
                    key={`${org.id}:program:${program.id}`}
                    className="overflow-hidden rounded-lg border border-border/70 bg-muted/25"
                  >
                    <PublicMapMediaImage
                      src={program.imageUrl ?? ""}
                      alt=""
                      wrapperClassName="h-20 bg-muted/30"
                    />
                    <div className="px-2 py-1.5">
                      <p className="line-clamp-1 text-[11px] font-medium text-foreground">{program.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              className={cn(
                "pointer-events-none relative z-10 mt-3 min-w-0",
                constrainedLayout
                  ? "grid grid-cols-1 gap-2"
                  : "flex flex-wrap items-end gap-2",
              )}
            >
              <div className="pointer-events-none flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="rounded-md border-border/70 bg-background/80 text-[10px] text-foreground">
                  {PUBLIC_MAP_GROUP_LABELS[org.primaryGroup]}
                </Badge>
                {org.isOnlineOnly ? (
                  <Badge variant="outline" className="rounded-md border-primary/45 bg-primary/10 text-[10px] text-primary">
                    <GlobeIcon className="mr-1 h-3 w-3" aria-hidden />
                    Web resource
                  </Badge>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "pointer-events-auto relative z-20 h-auto shrink-0 rounded-none border-0 bg-transparent px-0 py-0 text-[11px] text-foreground shadow-none hover:bg-transparent hover:text-foreground/80",
                  constrainedLayout ? "justify-self-end" : "ml-auto",
                )}
                onClick={() => (onOpenDetails ? onOpenDetails(org.id) : onSelectOrg(org.id))}
              >
                Details
                <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
