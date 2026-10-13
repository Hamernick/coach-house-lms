"use client"

import type { ReactNode } from "react"

import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"
import MinusIcon from "lucide-react/dist/esm/icons/minus"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCompactOrganizationLocation } from "@/lib/location/organization-location"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import { PublicMapResourceListCard } from "./organization-list-resource-card"

export function PublicMapOrganizationsRailSection({
  title,
  icon,
  organizations,
  resources = [],
  emptyTitle,
  emptyDescription,
  className,
  onSelectOrganization,
  onToggleFavorite,
  onSelectResource,
  onToggleCollectedResource,
  removable = false,
}: {
  title: string
  icon: ReactNode
  organizations: PublicMapOrganization[]
  resources?: ExternalResourceMapItem[]
  emptyTitle: string
  emptyDescription: string
  className?: string
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
  onSelectResource?: (resourceId: string) => void
  onToggleCollectedResource?: (resourceId: string) => void
  removable?: boolean
}) {
  return (
    <section
      className={cn(
        "bg-card/95 border-border/70 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border",
        className
      )}
    >
      <header className="border-border/60 flex shrink-0 items-center gap-2 border-b px-4 py-3">
        {icon}
        <p className="text-foreground truncate text-base font-medium">
          {title}
        </p>
      </header>

      <ScrollArea
        data-public-map-member-rail-section="saved-list-scroll"
        className="h-full min-h-0 flex-1 overflow-hidden bg-transparent"
        viewportClassName="scroll-fade-effect-y overscroll-contain [--mask-height:1.5rem] [--scroll-buffer:1rem] [scrollbar-width:thin]"
        contentClassName="p-4"
      >
        {organizations.length === 0 && resources.length === 0 ? (
          <Empty
            className="border-border/70 bg-background/70 min-h-[220px] rounded-xl border"
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div
            data-public-map-saved-organization-grid="true"
            className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] items-stretch gap-3"
          >
            {organizations.map((organization) => {
              const location = formatCompactOrganizationLocation({
                city: organization.city,
                state: organization.state,
                country: organization.country,
              })

              return (
                <article
                  key={organization.id}
                  className="border-border/70 bg-background/75 h-full rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-foreground hover:text-foreground h-auto w-0 max-w-full min-w-0 flex-1 justify-start overflow-hidden px-0 py-0 text-left font-normal whitespace-normal hover:bg-transparent"
                      onClick={() => onSelectOrganization(organization.id)}
                    >
                      <div className="w-full min-w-0 overflow-hidden">
                        <p className="text-foreground line-clamp-2 text-base leading-snug font-semibold text-pretty">
                          {organization.name}
                        </p>
                        {organization.tagline ? (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed text-pretty break-words">
                            {organization.tagline}
                          </p>
                        ) : null}
                        {location ? (
                          <p className="text-muted-foreground mt-2 inline-flex max-w-full items-center gap-1.5 text-xs">
                            <MapPinIcon
                              className="size-4 shrink-0"
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
                        size="icon"
                        className="border-border/70 bg-background/85 text-muted-foreground hover:bg-muted hover:text-foreground size-11 shrink-0 rounded-full border"
                        aria-label={`Remove ${organization.name} from My Map`}
                        onClick={() => onToggleFavorite(organization.id)}
                      >
                        <MinusIcon className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
            {resources.map((resource) => (
              <PublicMapResourceListCard
                key={resource.id}
                constrainedLayout
                item={resource}
                selected={false}
                collected
                onSelectItem={onSelectResource}
                onToggleCollected={onToggleCollectedResource}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </section>
  )
}
