import { PERSON_CATEGORY_META, type PersonCategory } from "@/lib/people/categories"

export const CATEGORY_ORDER: PersonCategory[] = [
  "governing_board",
  "advisory_board",
  "staff",
  "contractors",
  "vendors",
  "volunteers",
  "supporters",
]

export const CATEGORY_STRIP: Record<PersonCategory, string> = Object.fromEntries(
  Object.entries(PERSON_CATEGORY_META).map(([key, value]) => [key, value.stripClass]),
) as Record<PersonCategory, string>

export const CATEGORY_RANK = new Map(
  CATEGORY_ORDER.map((category, index) => [category, index]),
)

export const ORG_CHART_PADDING = 64
export const NODE_WIDTH = 240
export const NODE_HEIGHT = 56
export const NODE_HORIZONTAL_GAP = 56
export const NODE_VERTICAL_GAP = 70
export const SIDE_ZONE_GAP = 120
export const ZONE_VERTICAL_GAP = 88
export const MAX_HISTORY = 40
export const SAVE_DEBOUNCE_MS = 260
export const LEADERSHIP_TITLE_PATTERN =
  /\b(founder|executive|director|president|chief|ceo|coo|cto|head|lead|chair)\b/i
