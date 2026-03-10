"use client"

import BookmarkIcon from "lucide-react/dist/esm/icons/bookmark"
import HeartIcon from "lucide-react/dist/esm/icons/heart"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

function formatLocation(organization: PublicMapOrganization) {
  return [organization.city, organization.state, organization.country]
    .filter((entry) => Boolean(entry && entry.trim().length > 0))
    .join(", ")
}

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
    <div className="flex min-h-full flex-col gap-3">
      <section className="md:mt-10 rounded-2xl border border-border/70 bg-card/95">
        <header className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <BookmarkIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="truncate text-sm font-medium text-foreground">Saved organizations</p>
            <span className="rounded-full border border-border/70 bg-background px-1.5 text-[10px] text-muted-foreground">
              {favoritesCount}
            </span>
          </div>
        </header>

        <div className="max-h-[52vh] overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
          {savedOrganizations.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-4 text-center">
              <p className="text-sm font-medium text-foreground">No saved organizations yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap the heart on any organization to save it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedOrganizations.map((organization) => {
                const location = formatLocation(organization)
                return (
                  <article
                    key={organization.id}
                    className="rounded-xl border border-border/70 bg-background/75 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto min-w-0 flex-1 justify-start px-0 py-0 text-left font-normal text-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => onSelectOrganization(organization.id)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {organization.name}
                          </p>
                          {organization.tagline ? (
                            <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">
                              {organization.tagline}
                            </p>
                          ) : null}
                          {location ? (
                            <p className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              <span className="truncate">{location}</span>
                            </p>
                          ) : null}
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-border/70 bg-background/85 text-primary hover:bg-muted"
                        onClick={() => onToggleFavorite(organization.id)}
                        aria-label={`Remove ${organization.name} from saved organizations`}
                      >
                        <HeartIcon className="h-4 w-4 fill-current" aria-hidden />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-md border-border/70 bg-background/85 text-[10px] text-foreground"
                      >
                        {organization.programCount} program
                        {organization.programCount === 1 ? "" : "s"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-md border border-border/70 bg-background/85 px-2.5 text-[11px] text-foreground hover:bg-muted"
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
        </div>
      </section>
    </div>
  )
}
