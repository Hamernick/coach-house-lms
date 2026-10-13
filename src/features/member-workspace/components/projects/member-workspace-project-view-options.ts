export type MemberWorkspaceProjectViewType = "list" | "board" | "timeline"

export type MemberWorkspaceProjectOrdering = "manual" | "alphabetical" | "date"

export type MemberWorkspaceProjectViewOptions = {
  viewType: MemberWorkspaceProjectViewType
  ordering: MemberWorkspaceProjectOrdering
  showClosedProjects: boolean
  properties: Array<"title" | "status" | "assignee" | "dueDate">
}

export type MemberWorkspaceProjectFilterChip = {
  key: string
  value: string
}

export const DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS: MemberWorkspaceProjectViewOptions = {
  viewType: "list",
  ordering: "manual",
  showClosedProjects: true,
  properties: ["title", "status", "assignee", "dueDate"],
}

function normalizeKey(key: string) {
  const normalized = key.trim().toLowerCase()
  if (normalized.startsWith("status")) return "status"
  if (normalized.startsWith("priority")) return "priority"
  if (normalized.startsWith("tag")) return "tags"
  if (normalized.startsWith("member") || normalized === "pic") return "members"
  return normalized
}

export function chipsToParams(chips: MemberWorkspaceProjectFilterChip[]) {
  const params = new URLSearchParams()
  const buckets: Record<string, string[]> = {}

  for (const chip of chips) {
    const key = normalizeKey(chip.key)
    buckets[key] = buckets[key] || []
    buckets[key].push(chip.value)
  }

  for (const [key, values] of Object.entries(buckets)) {
    if (values.length > 0) {
      params.set(key, values.join(","))
    }
  }

  return params
}

export function paramsToChips(params: URLSearchParams): MemberWorkspaceProjectFilterChip[] {
  const chips: MemberWorkspaceProjectFilterChip[] = []
  const add = (key: string, values?: string | null) => {
    if (!values) return
    values.split(",").forEach((value) => {
      if (!value) return
      chips.push({ key, value })
    })
  }

  add("Status", params.get("status"))
  add("Priority", params.get("priority"))
  add("Tag", params.get("tags"))
  add("Member", params.get("members"))

  return chips
}

function isViewType(value: string | null): value is MemberWorkspaceProjectViewType {
  return value === "list" || value === "board" || value === "timeline"
}

function isOrdering(value: string | null): value is MemberWorkspaceProjectOrdering {
  return value === "manual" || value === "alphabetical" || value === "date"
}

const PROJECT_PROPERTY_ORDER = ["title", "status", "assignee", "dueDate"] as const

function isProjectProperty(
  value: string,
): value is MemberWorkspaceProjectViewOptions["properties"][number] {
  return PROJECT_PROPERTY_ORDER.includes(
    value as MemberWorkspaceProjectViewOptions["properties"][number],
  )
}

export function paramsToViewOptions(params: URLSearchParams): MemberWorkspaceProjectViewOptions {
  const viewValue = params.get("view")
  const orderValue = params.get("order")
  const properties = (params.get("properties") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(isProjectProperty)

  return {
    ...DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS,
    viewType: isViewType(viewValue)
      ? viewValue
      : DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS.viewType,
    ordering: isOrdering(orderValue)
      ? orderValue
      : DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS.ordering,
    showClosedProjects: params.get("closed") !== "hide",
    properties:
      properties.length > 0
        ? Array.from(new Set(["title", ...properties]))
        : DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS.properties,
  }
}

export function applyViewOptionsToParams(
  params: URLSearchParams,
  options: MemberWorkspaceProjectViewOptions,
) {
  if (options.viewType === DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS.viewType) {
    params.delete("view")
  } else {
    params.set("view", options.viewType)
  }

  if (options.ordering === DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS.ordering) {
    params.delete("order")
  } else {
    params.set("order", options.ordering)
  }

  if (options.showClosedProjects) {
    params.delete("closed")
  } else {
    params.set("closed", "hide")
  }

  const normalizedProperties = Array.from(
    new Set(["title", ...options.properties]),
  ).filter(isProjectProperty)

  const defaultProperties =
    DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS.properties.join(",")
  const nextProperties = normalizedProperties.join(",")

  if (nextProperties === defaultProperties) {
    params.delete("properties")
  } else {
    params.set("properties", nextProperties)
  }

  return params
}
