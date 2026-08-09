"use client"

import { useMemo } from "react"

import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-layer-api"

import type { PublicMapItem } from "@/lib/public-map/resource-map-items"
import { resolvePublicMapListItemsFromSelectableIds } from "./map-items-state"
import type { PublicMapSidebarSearchContext } from "./sidebar"

export function usePublicMapSameLocationSearchContext({
  itemBySelectableId,
  sameLocationSelection,
  setSameLocationSelection,
}: {
  itemBySelectableId: Map<string, PublicMapItem>
  sameLocationSelection: PublicMapSameLocationSelection | null
  setSameLocationSelection: (
    selection: PublicMapSameLocationSelection | null
  ) => void
}): PublicMapSidebarSearchContext | null {
  const sameLocationItems = useMemo(
    () =>
      sameLocationSelection
        ? resolvePublicMapListItemsFromSelectableIds({
            itemBySelectableId,
            selectableIds: sameLocationSelection.organizationIds,
          })
        : [],
    [itemBySelectableId, sameLocationSelection]
  )

  return useMemo(() => {
    if (!sameLocationSelection || sameLocationItems.length < 2) return null

    const title = `${sameLocationItems.length.toLocaleString()} resources here`
    return {
      title,
      description: sameLocationSelection.locationLabel,
      items: sameLocationItems,
      onClear: () => setSameLocationSelection(null),
    }
  }, [sameLocationItems, sameLocationSelection, setSameLocationSelection])
}
