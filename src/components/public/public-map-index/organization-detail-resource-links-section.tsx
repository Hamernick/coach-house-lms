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

import {
  PUBLIC_MAP_DETAIL_BODY_CLASSNAME,
  PUBLIC_MAP_DETAIL_SECTION_CLASSNAME,
} from "./sidebar-theme"

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
    <section className={PUBLIC_MAP_DETAIL_SECTION_CLASSNAME}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">Links from activities</h3>
        <span className="text-muted-foreground text-xs tabular-nums">
          {resources.length}
        </span>
      </div>
      <p className={cn("mt-1.5", PUBLIC_MAP_DETAIL_BODY_CLASSNAME)}>
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
                "group flex min-h-12 min-w-0 items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color,color]",
                "hover:bg-muted/55 focus-visible:bg-muted/55 focus-visible:ring-ring/45 focus-visible:ring-2 focus-visible:outline-none",
                "motion-reduce:transition-none"
              )}
            >
              <span
                className="bg-muted text-muted-foreground mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg"
                aria-hidden
              >
                <ResourceIcon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="text-foreground block truncate text-sm font-medium">
                      {resource.label}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {resource.domain}
                    </span>
                    <span className="text-muted-foreground/80 block truncate text-xs">
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
                    className="min-h-6 rounded-full border-transparent px-2 py-1 text-xs leading-none"
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
