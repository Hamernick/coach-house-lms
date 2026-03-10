import type { SortColumn } from "./types"

export const FILTER_SOURCE_PREFIX = "src:"
export const FILTER_STATUS_PREFIX = "status:"
export const FILTER_VISIBILITY_PREFIX = "vis:"
export const FILTER_CATEGORY_PREFIX = "cat:"
export const FILTER_SPECIAL_NEEDS_ATTENTION = "special:needs_attention"
export const FILTER_SPECIAL_UPDATED_30_DAYS = "special:updated_30d"

export const SHOW_NEW_POLICY_BUTTON = false

export const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  status: "Status",
  name: "Name",
  category: "Category",
  source: "Source",
  visibility: "Visibility",
  updatedAt: "Last updated",
}
