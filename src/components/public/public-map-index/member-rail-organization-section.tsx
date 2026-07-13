"use client"

import type { ReactNode } from "react"

import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCompactOrganizationLocation } from "@/lib/location/organization-location"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { cn } from "@/lib/utils"

export function PublicMapOrganizationsRailSection({
  title,
  icon,
  organizations,
  emptyTitle,
  emptyDescription,
  className,
  onSelectOrganization,
  onToggleFavorite,
  removable = false,
}: {
  title: string
  icon: ReactNode
  organizations: PublicMapOrganization[]
  emptyTitle: string
  emptyDescription: string
  className?: string
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
  removable?: boolean
}) {
  return (
    <section
      className={cn(
        "bg-card/95 border-border/70 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border",
        className
      )}
    >
      <header className="border-border/60 flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        {icon}
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
      </header>

      <ScrollArea
        data-public-map-member-rail-section="saved-list-scroll"
        className="h-full min-h-0 flex-1 overflow-hidden"
        viewportClassName="scroll-fade-effect-y overscroll-contain [--mask-height:1.5rem] [--scroll-buffer:1rem] [scrollbar-width:thin]"
        contentClassName="px-3 py-3"
      >
        {organizations.length === 0 ? (
          <Empty
            className="border-border/70 bg-background/70 min-h-[220px] rounded-xl border"
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
                  className="border-border/70 bg-background/75 rounded-xl border p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-foreground hover:text-foreground h-auto w-0 max-w-full min-w-0 flex-1 justify-start overflow-hidden px-0 py-0 text-left font-normal whitespace-normal hover:bg-transparent"
                      onClick={() => onSelectOrganization(organization.id)}
                    >
                      <div className="w-full min-w-0 overflow-hidden">
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
                    {removable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="border-border/70 bg-background/85 h-8 rounded-full border px-2 text-xs"
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
      </ScrollArea>
    </section>
  )
}
