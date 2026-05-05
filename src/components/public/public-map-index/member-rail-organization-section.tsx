"use client"

import type { ReactNode } from "react"

import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { formatCompactOrganizationLocation } from "@/lib/location/organization-location"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

export function PublicMapOrganizationsRailSection({
  title,
  icon,
  organizations,
  emptyTitle,
  emptyDescription,
  onSelectOrganization,
  onToggleFavorite,
  removable = false,
}: {
  title: string
  icon: ReactNode
  organizations: PublicMapOrganization[]
  emptyTitle: string
  emptyDescription: string
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
  removable?: boolean
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95">
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        {icon}
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
      </header>

      <div className="max-h-[52vh] overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
        {organizations.length === 0 ? (
          <Empty
            className="min-h-[220px] rounded-xl border border-border/70 bg-background/70"
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {organizations.map((organization) => {
              const location = formatCompactOrganizationLocation({
                city: organization.city,
                state: organization.state,
                country: organization.country,
              })

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
                    {removable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full border border-border/70 bg-background/85 px-2 text-xs"
                        onClick={() => onToggleFavorite(organization.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
