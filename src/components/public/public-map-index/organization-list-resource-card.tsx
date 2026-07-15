"use client"

import {
  resolvePublicMapItemSelectableId,
  type ExternalResourceMapItem,
} from "@/lib/public-map/resource-map-items"
import {
  PUBLIC_MAP_RESOURCE_CATEGORY_LABELS,
  resolvePublicMapResourceCategoryColor,
} from "@/lib/public-map/resource-categories"
import { cn } from "@/lib/utils"
import {
  buildPublicMapOrganizationListCardOwnerId,
  buildPublicMapOrganizationListCardOwnerProps,
  buildPublicMapOrganizationListCardSurfaceProps,
} from "./react-grab"
import {
  buildResourceMetadataItems,
  PUBLIC_MAP_LIST_CARD_PERF_STYLE,
  PublicMapListMetadataStrip,
  PublicMapListViewButton,
} from "./organization-list-card-shared"
import { PublicMapResourceCategoryIcon } from "./resource-category-icon"

function normalizeResourceListCardText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? ""
}

function resolveResourceListCardSubtitle(item: ExternalResourceMapItem) {
  const subtitle = item.subtitle?.trim()
  if (!subtitle) return null
  return normalizeResourceListCardText(subtitle) ===
    normalizeResourceListCardText(item.title)
    ? null
    : subtitle
}

export function PublicMapResourceListCard({
  constrainedLayout,
  item,
  selected,
  onSelectItem,
}: {
  constrainedLayout: boolean
  item: ExternalResourceMapItem
  selected: boolean
  onSelectItem?: (id: string) => void
}) {
  const selectableItemId = resolvePublicMapItemSelectableId(item)
  const metadataItems = buildResourceMetadataItems({ item })
  const ownerId = buildPublicMapOrganizationListCardOwnerId(selectableItemId)
  const markerColor = resolvePublicMapResourceCategoryColor(
    item.primaryResourceCategory
  )
  const cardTitle =
    PUBLIC_MAP_RESOURCE_CATEGORY_LABELS[item.primaryResourceCategory]
  const subtitle = resolveResourceListCardSubtitle(item)
  const openResourceDetails = () => onSelectItem?.(selectableItemId)

  return (
    <article
      key={item.id}
      style={PUBLIC_MAP_LIST_CARD_PERF_STYLE}
      className={cn(
        "group text-foreground relative w-full max-w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-transparent bg-transparent shadow-none transition-[border-color,background-color,color] outline-none",
        "focus-within:border-border/80 focus-within:bg-accent focus-within:text-accent-foreground dark:focus-within:bg-accent/50",
        "focus-visible:border-border/80 focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-ring/35 dark:focus-visible:bg-accent/50 focus-visible:ring-2",
        "motion-reduce:transition-none",
        selected
          ? "border-primary/35 bg-accent text-accent-foreground dark:bg-accent/50"
          : "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${item.title}`}
      onClick={openResourceDetails}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        openResourceDetails()
      }}
      {...buildPublicMapOrganizationListCardOwnerProps({
        ownerId,
        slot: "card",
        notes:
          "Clicking the non-action parts of the card opens the resource detail panel.",
      })}
    >
      <div
        className={cn(
          "relative z-10 flex min-w-0 flex-col",
          constrainedLayout ? "gap-2.5 p-2.5" : "gap-3 p-3"
        )}
        {...buildPublicMapOrganizationListCardSurfaceProps({
          ownerId,
          slot: "body",
          surfaceKind: "content",
          notes: "Primary content stack for the public map resource list card.",
        })}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            constrainedLayout ? "gap-2.5" : "gap-3"
          )}
          {...buildPublicMapOrganizationListCardSurfaceProps({
            ownerId,
            slot: "identity-row",
            notes:
              "Top identity row containing the resource marker, title, and metadata.",
          })}
        >
          <span
            className="border-border/60 bg-background/85 mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border"
            {...buildPublicMapOrganizationListCardSurfaceProps({
              ownerId,
              slot: "avatar",
              surfaceKind: "indicator",
              notes: "Resource category marker surface.",
            })}
          >
            <span
              className="inline-flex size-7 items-center justify-center rounded-full shadow-sm"
              style={{ backgroundColor: markerColor }}
              aria-hidden
            >
              <PublicMapResourceCategoryIcon
                category={item.primaryResourceCategory}
                className="size-4 text-white"
              />
            </span>
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className="text-foreground line-clamp-2 text-[15px] leading-tight font-semibold"
              {...buildPublicMapOrganizationListCardSurfaceProps({
                ownerId,
                slot: "title",
                notes: "Primary resource category text block.",
              })}
            >
              {cardTitle}
            </p>
            <PublicMapListMetadataStrip
              itemKeyPrefix="resource"
              items={metadataItems}
              notes="Inline metadata strip for the resource list card."
              ownerId={ownerId}
            />
          </div>
          <PublicMapListViewButton
            ownerId={ownerId}
            onClick={openResourceDetails}
            notes="Explicit right-aligned call-to-action button for opening resource details."
          />
        </div>
        {subtitle ? (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>
    </article>
  )
}
