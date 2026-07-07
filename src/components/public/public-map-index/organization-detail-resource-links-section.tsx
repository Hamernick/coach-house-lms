"use client"

import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import LinkIcon from "lucide-react/dist/esm/icons/link"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Badge } from "@/components/ui/badge"
import type {
  PublicMapOrganizationResourceLink,
  PublicMapResourceLinkKind,
} from "@/lib/public-map/resource-links"
import { cn } from "@/lib/utils"

import { PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME } from "./sidebar-theme"

const RESOURCE_KIND_ICON_MAP = {
  online_resource: LinkIcon,
  location: MapPinIcon,
} satisfies Record<PublicMapResourceLinkKind, typeof LinkIcon>

export function OrganizationDetailResourceLinksSection({
  resources,
}: {
  resources: PublicMapOrganizationResourceLink[]
}) {
  if (resources.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Links from activities</p>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {resources.length}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-[11px] leading-4">
        Links attached to published programs, events, services, and web
        resources from this organization.
      </p>
      <div className="mt-2 space-y-1.5">
        {resources.map((resource) => {
          const ResourceIcon = RESOURCE_KIND_ICON_MAP[resource.kind]
          return (
            <a
              key={resource.key}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "group flex min-w-0 items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-[background-color,color]",
                "hover:bg-muted/55 focus-visible:bg-muted/55 focus-visible:ring-ring/45 focus-visible:ring-2 focus-visible:outline-none",
                "motion-reduce:transition-none"
              )}
            >
              <span
                className="bg-muted text-muted-foreground mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg"
                aria-hidden
              >
                <ResourceIcon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="text-foreground block truncate text-xs font-medium">
                      {resource.label}
                    </span>
                    <span className="text-muted-foreground block truncate text-[11px]">
                      {resource.domain}
                    </span>
                    <span className="text-muted-foreground/80 block truncate text-[10px]">
                      {resource.note}
                    </span>
                  </span>
                  <ExternalLinkIcon
                    className="text-muted-foreground group-hover:text-foreground mt-0.5 size-3.5 shrink-0 transition-colors"
                    aria-hidden
                  />
                </span>
                <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
                  <Badge
                    variant="secondary"
                    className="h-5 rounded-full border-transparent px-1.5 py-0 text-[10px] leading-none"
                  >
                    {resource.kindLabel}
                  </Badge>
                </span>
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
