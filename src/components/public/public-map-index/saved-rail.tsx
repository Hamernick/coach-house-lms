"use client"

import BookmarkIcon from "lucide-react/dist/esm/icons/bookmark"
import HeartIcon from "lucide-react/dist/esm/icons/heart"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCompactOrganizationLocation } from "@/lib/location/organization-location"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

type PublicMapSavedRailProps = {
  savedOrganizations: PublicMapOrganization[]
  favoritesCount: number
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
}

export function PublicMapSavedRail({
  savedOrganizations,
  favoritesCount,
  onSelectOrganization,
  onToggleFavorite,
}: PublicMapSavedRailProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
      <section className="border-border/70 bg-card/95 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border md:mt-10">
        <header className="border-border/60 flex shrink-0 items-center justify-between border-b px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <BookmarkIcon
              className="text-muted-foreground h-4 w-4"
              aria-hidden
            />
            <p className="text-foreground truncate text-sm font-medium">
              Saved organizations
            </p>
            <span className="border-border/70 bg-background text-muted-foreground rounded-full border px-1.5 text-[10px]">
              {favoritesCount}
            </span>
          </div>
        </header>

        <ScrollArea
          data-public-map-right-rail-section="saved-organizations-scroll"
          className="h-full min-h-0 flex-1 overflow-hidden"
          viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem]"
          contentClassName="px-3 py-3"
        >
          {savedOrganizations.length === 0 ? (
            <div className="border-border/70 bg-background/70 rounded-xl border px-3 py-4 text-center">
              <p className="text-foreground text-sm font-medium">
                No saved organizations yet
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Tap the heart on any organization to save it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedOrganizations.map((organization) => {
                const location = formatCompactOrganizationLocation({
                  city: organization.city,
                  state: organization.state,
                  country: organization.country,
                })
                return (
                  <article
                    key={organization.id}
                    className="border-border/70 bg-background/75 rounded-xl border p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-foreground hover:text-foreground h-auto min-w-0 flex-1 justify-start px-0 py-0 text-left font-normal hover:bg-transparent"
                        onClick={() => onSelectOrganization(organization.id)}
                      >
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-semibold">
                            {organization.name}
                          </p>
                          {organization.tagline ? (
                            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs break-words">
                              {organization.tagline}
                            </p>
                          ) : null}
                          {location ? (
                            <p className="text-muted-foreground mt-1 inline-flex max-w-full items-center gap-1 text-[11px]">
                              <MapPinIcon
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                              <span className="truncate">{location}</span>
                            </p>
                          ) : null}
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="border-border/70 bg-background/85 text-primary hover:bg-muted h-8 w-8 rounded-full border"
                        onClick={() => onToggleFavorite(organization.id)}
                        aria-label={`Remove ${organization.name} from saved organizations`}
                      >
                        <HeartIcon
                          className="h-4 w-4 fill-current"
                          aria-hidden
                        />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-border/70 bg-background/85 text-foreground rounded-md text-[10px]"
                      >
                        {organization.programCount} program
                        {organization.programCount === 1 ? "" : "s"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="border-border/70 bg-background/85 text-foreground hover:bg-muted h-7 rounded-md border px-2.5 text-[11px]"
                        onClick={() => onSelectOrganization(organization.id)}
                      >
                        Open
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </section>
    </div>
  )
}
