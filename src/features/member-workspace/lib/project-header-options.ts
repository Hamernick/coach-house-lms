import type { ProjectOptionSettings } from "./project-option-settings"

export function parseProjectHeaderTags(value: string) {
  const seen = new Set<string>()
  return value.split(",").map((tag) => tag.trim()).filter((tag) => {
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function replaceProjectHeaderTag(value: string, previous: string | null, next: string | null) {
  const tags = parseProjectHeaderTags(value)
  const updated = previous === null
    ? [...tags, next ?? ""]
    : tags.map((tag) => tag.toLowerCase() === previous.toLowerCase() ? next ?? "" : tag)
  return parseProjectHeaderTags(updated.join(",")).join(", ")
}

export function includeCurrentProjectHeaderOptions(
  settings: ProjectOptionSettings,
  tags: string,
  type: string,
  createId: () => string = () => crypto.randomUUID(),
): ProjectOptionSettings {
  const include = (options: ProjectOptionSettings["tags"], labels: string[]) => {
    const result = [...options]
    for (const label of labels) {
      if (label && !result.some((option) => option.label.toLowerCase() === label.toLowerCase())) {
        result.push({ id: createId(), label, color: "#64748b" })
      }
    }
    return result
  }
  return { tags: include(settings.tags, parseProjectHeaderTags(tags)), sprintTypes: include(settings.sprintTypes, [type.trim()]) }
}
