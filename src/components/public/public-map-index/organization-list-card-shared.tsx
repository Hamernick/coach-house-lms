"use client"

import { Button } from "@/components/ui/button"
import { PUBLIC_MAP_GROUP_LABELS } from "@/lib/public-map/groups"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { cn } from "@/lib/utils"
import { buildPublicMapOrganizationListCardSurfaceProps } from "./react-grab"

export const PUBLIC_MAP_LIST_CARD_PERF_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "80px",
} as const

export const PUBLIC_MAP_LIST_CARD_HEIGHT_CLASSNAME = "h-20"

export function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "O"
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

export function buildLocationMetadataItems({
  primaryGroup,
  isOnlineOnly,
}: {
  primaryGroup: PublicMapOrganization["primaryGroup"]
  isOnlineOnly: boolean
}) {
  return [isOnlineOnly ? "Web resource" : PUBLIC_MAP_GROUP_LABELS[primaryGroup]]
}

export function PublicMapListMetadataStrip({
  className,
  itemKeyPrefix,
  items,
  notes,
  ownerId,
}: {
  className?: string
  itemKeyPrefix: string
  items: string[]
  notes: string
  ownerId: string
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground mt-0.5 flex max-w-full items-center gap-2 text-sm leading-relaxed",
        className
      )}
      {...buildPublicMapOrganizationListCardSurfaceProps({
        ownerId,
        slot: "meta-row",
        notes,
      })}
    >
      <div
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0"
        {...buildPublicMapOrganizationListCardSurfaceProps({
          ownerId,
          slot: "location",
          notes,
        })}
      >
        {items.map((item, index) => (
          <span
            key={`${itemKeyPrefix}-meta-${index}`}
            className={cn(
              "inline-flex min-w-0 items-center",
              index === 0 && "max-w-full"
            )}
          >
            {index > 0 ? (
              <span aria-hidden className="text-muted-foreground/70 mr-1.5">
                •
              </span>
            ) : null}
            <span
              className={cn(
                "min-w-0",
                index === 0 ? "truncate" : "whitespace-nowrap"
              )}
            >
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function PublicMapListViewButton({
  notes,
  onClick,
  ownerId,
}: {
  notes: string
  onClick: () => void
  ownerId: string
}) {
  return (
    <Button
      type="button"
      variant="link"
      className={cn(
        "pointer-events-auto relative z-20 ml-auto h-11 min-w-11 shrink-0 justify-end self-center px-0 py-0 text-right text-sm font-medium text-[#06c] no-underline shadow-none",
        "transition-colors duration-150 ease-out motion-reduce:transition-none",
        "group-focus-within:text-[#0077ed] group-hover:text-[#0077ed]",
        "hover:bg-transparent hover:text-[#0077ed] hover:no-underline",
        "focus-visible:bg-transparent focus-visible:text-[#0077ed] focus-visible:no-underline"
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      {...buildPublicMapOrganizationListCardSurfaceProps({
        ownerId,
        slot: "view-button",
        surfaceKind: "trigger",
        notes,
      })}
    >
      View
    </Button>
  )
}
