export const DEFAULT_PLACEHOLDER = "Start writing..."
export const ROADMAP_DRAFT_STORAGE_VERSION = 1
export const ROADMAP_TOOLBAR_ID = "roadmap-editor-toolbar"

const FUNDRAISING_CHILD_IDS = [
  "fundraising_strategy",
  "fundraising_presentation",
  "fundraising_crm_plan",
]
const BOARD_CHILD_IDS = ["board_calendar", "board_handbook"]

export const ROADMAP_TOC_GROUPS = [
  { id: "origin_story" },
  { id: "need" },
  { id: "mission_vision_values" },
  { id: "theory_of_change" },
  { id: "program" },
  { id: "evaluation" },
  { id: "people" },
  { id: "budget" },
  { id: "fundraising", children: FUNDRAISING_CHILD_IDS },
  { id: "communications" },
  { id: "board_strategy", children: BOARD_CHILD_IDS },
  { id: "next_actions" },
]

export const ROADMAP_TOC_GROUP_PARENT_BY_CHILD = new Map<string, string>([
  ...(FUNDRAISING_CHILD_IDS.map((id) => [id, "fundraising"] as const)),
  ...(BOARD_CHILD_IDS.map((id) => [id, "board_strategy"] as const)),
])
