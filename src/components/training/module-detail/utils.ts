import type { ModuleAssignmentField } from "../types"

export type AssignmentValues = Record<string, string | string[] | number>

export type OptionItem = {
  key: string
  value: string
  label: string
}

export function assignmentValuesEqual(a: AssignmentValues, b: AssignmentValues): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    const valueA = a[key]
    const valueB = b[key]
    if (Array.isArray(valueA) || Array.isArray(valueB)) {
      if (!Array.isArray(valueA) || !Array.isArray(valueB)) {
        return false
      }
      if (valueA.length !== valueB.length) return false
      for (let index = 0; index < valueA.length; index += 1) {
        if (valueA[index] !== valueB[index]) return false
      }
    } else if (valueA !== valueB) {
      return false
    }
  }
  return true
}

export function normalizeOptions(raw: unknown[]): OptionItem[] {
  return raw.map((option, index) => {
    if (typeof option === "string") {
      const value = option
      return {
        key: `${value}-${index}`,
        value,
        label: option,
      }
    }

    if (option && typeof option === "object") {
      const record = option as Record<string, unknown>
      const rawValue = typeof record.value === "string" ? record.value : null
      const rawLabel = typeof record.label === "string" ? record.label : null
      const value = rawValue ?? rawLabel ?? `option-${index + 1}`
      const label = rawLabel ?? value
      return {
        key: `${value}-${index}`,
        value,
        label,
      }
    }

    const fallback = `option-${index + 1}`
    return {
      key: `${fallback}-${index}`,
      value: fallback,
      label: fallback,
    }
  })
}

export function buildAssignmentValues(
  fields: ModuleAssignmentField[],
  answers?: Record<string, unknown> | null,
): AssignmentValues {
  const map: AssignmentValues = {}

  fields.forEach((field) => {
    if (field.type === "subtitle") {
      return
    }

    const rawValue = answers ? answers[field.name] : undefined

    switch (field.type) {
      case "multi_select": {
        const value = Array.isArray(rawValue)
          ? (rawValue as unknown[])
              .map((item) => (typeof item === "string" ? item : String(item ?? "")))
              .filter(Boolean)
          : []
        map[field.name] = value
        break
      }
      case "slider": {
        const min = field.min ?? 0
        let numeric: number | null = null
        if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
          numeric = rawValue
        } else if (typeof rawValue === "string") {
          const asNumber = Number(rawValue)
          numeric = Number.isFinite(asNumber) ? asNumber : null
        }
        map[field.name] = numeric ?? min
        break
      }
      default: {
        const value =
          typeof rawValue === "string"
            ? rawValue
            : rawValue != null
              ? String(rawValue)
              : ""
        map[field.name] = value
      }
    }
  })

  return map
}

export function formatTimestamp(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString()
}

export function getVideoEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()
    if (host.includes("youtube.com")) {
      const videoId = url.searchParams.get("v")
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (host.includes("youtu.be")) {
      const videoId = url.pathname.replace(/^\//, "")
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (host.includes("vimeo.com")) {
      const videoId = url.pathname.replace(/^\//, "")
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
    if (host.includes("loom.com")) {
      const videoId = url.pathname.split("/").pop()
      return videoId ? `https://www.loom.com/embed/${videoId}` : null
    }
  } catch {
    return null
  }
  return null
}

export function getInlineVideoUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    const ext = url.pathname.split(".").pop()?.toLowerCase() ?? ""
    if (["mp4", "mov", "webm", "ogg"].includes(ext)) {
      return rawUrl
    }
  } catch {
    return null
  }
  return null
}
