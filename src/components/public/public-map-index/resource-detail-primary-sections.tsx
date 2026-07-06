"use client"

import { useState } from "react"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PUBLIC_MAP_RESOURCE_CATEGORY_LABELS,
  resolvePublicMapResourceCategoryColor,
} from "@/lib/public-map/resource-categories"
import { isPublicMapTechnicalSourceUrl } from "@/lib/public-map/resource-link-visibility"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import {
  buildResourceAddressLines,
  buildResourceLocation,
  formatResourceVerifiedDate,
  isExternalHttpHref,
  normalizeResourceHref,
  normalizeResourceImageSrc,
  PUBLIC_MAP_RESOURCE_STATUS_LABELS,
} from "./resource-detail-helpers"
import {
  PublicMapResourceAdminActions,
  type PublicMapResourceCurationAction,
} from "./resource-detail-admin-actions"
import { PublicMapResourceCategoryIcon } from "./resource-category-icon"
import {
  PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_PILL_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME,
} from "./sidebar-theme"

function PublicMapResourceIdentityMedia({
  item,
  markerColor,
}: {
  item: ExternalResourceMapItem
  markerColor: string
}) {
  const imageSrc = normalizeResourceImageSrc(item.markerImageUrl)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const showImage = Boolean(imageSrc && !errored)

  return (
    <div className="border-border/70 bg-muted/25 relative flex size-20 items-center justify-center overflow-hidden rounded-2xl border shadow-sm">
      <span
        className="inline-flex size-8 items-center justify-center rounded-full"
        style={{ backgroundColor: markerColor }}
        aria-hidden
      >
        <PublicMapResourceCategoryIcon
          category={item.primaryResourceCategory}
          className="size-4.5 text-white"
        />
      </span>
      {showImage ? (
        <>
          {!loaded ? (
            <Skeleton className="bg-muted/45 absolute inset-0" aria-hidden />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc!}
            alt={`${item.title} image`}
            loading="eager"
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setErrored(true)
              setLoaded(false)
            }}
          />
        </>
      ) : null}
    </div>
  )
}

export function PublicMapResourceDetailChrome({
  canManageResourceMap = false,
  item,
  onBack,
  resourceMapCurationAction,
}: {
  canManageResourceMap?: boolean
  item: ExternalResourceMapItem
  onBack: () => void
  resourceMapCurationAction?: PublicMapResourceCurationAction
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={cn(
            "h-8 w-8 rounded-full",
            PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
          )}
          aria-label="Back to search"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        </Button>
        <p className="text-foreground text-sm font-medium">Resource</p>
      </div>
      <div className="flex items-center gap-1.5">
        {canManageResourceMap && resourceMapCurationAction ? (
          <PublicMapResourceAdminActions
            curationAction={resourceMapCurationAction}
            item={item}
            onComplete={onBack}
          />
        ) : null}
      </div>
    </div>
  )
}

export function PublicMapResourceIdentitySection({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const location = buildResourceLocation(item)
  const subtitle = resolveResourceIdentitySubtitle(item)
  const markerColor = resolvePublicMapResourceCategoryColor(
    item.primaryResourceCategory
  )

  return (
    <div>
      <div className="mb-2 flex justify-center">
        <PublicMapResourceIdentityMedia item={item} markerColor={markerColor} />
      </div>
      <p className="text-2xl leading-tight font-semibold">{item.title}</p>
      {subtitle ? (
        <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
      ) : null}
      {location ? (
        <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs">
          <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
          {location}
        </p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {item.resourceCategories.map((category) => (
          <span
            key={category}
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px]",
              PUBLIC_MAP_SIDEBAR_PILL_CLASSNAME
            )}
          >
            {PUBLIC_MAP_RESOURCE_CATEGORY_LABELS[category]}
          </span>
        ))}
      </div>
    </div>
  )
}

function normalizeResourceIdentityText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? ""
}

function resolveResourceIdentitySubtitle(item: ExternalResourceMapItem) {
  const subtitle = item.subtitle?.trim()
  if (!subtitle) return null
  return normalizeResourceIdentityText(subtitle) ===
    normalizeResourceIdentityText(item.title)
    ? null
    : subtitle
}

export function PublicMapResourceStatusSection({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const verifiedDate = formatResourceVerifiedDate(item.lastVerifiedAt)
  const rows = [
    {
      label: "Status",
      value: PUBLIC_MAP_RESOURCE_STATUS_LABELS[item.verificationStatus],
    },
    {
      label: "Visibility",
      value:
        item.visibility === "superadmin_preview" ? "Seed preview" : "Published",
    },
    { label: "Source", value: item.sourceLabel },
    { label: "Last verified", value: verifiedDate },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Details</p>
      <dl className="mt-2 grid gap-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[6rem_1fr] gap-2">
            <dt className="text-muted-foreground text-xs">{row.label}</dt>
            <dd className="text-foreground min-w-0 text-xs font-medium break-words">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function PublicMapResourceAddressSection({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const addressLines = buildResourceAddressLines(item)
  if (!addressLines || addressLines.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Address</p>
      <div className="text-muted-foreground mt-1.5 space-y-0.5 text-sm">
        {addressLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  )
}

export function PublicMapResourceSourceAction({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const sourceHref = normalizeResourceHref(item.sourceUrl)
  if (!sourceHref || isPublicMapTechnicalSourceUrl(sourceHref)) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Data source</p>
      <Button
        asChild
        variant="ghost"
        className={cn(
          "mt-2 h-11 w-full rounded-xl px-3 text-xs",
          PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
        )}
      >
        <a
          href={sourceHref}
          target={isExternalHttpHref(sourceHref) ? "_blank" : undefined}
          rel={isExternalHttpHref(sourceHref) ? "noreferrer" : undefined}
          className="flex h-full w-full items-center justify-center gap-2"
        >
          <ExternalLinkIcon className="h-4 w-4" aria-hidden />
          <span>Open source</span>
        </a>
      </Button>
    </section>
  )
}
