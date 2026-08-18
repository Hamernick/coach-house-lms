import type { RoadmapSection } from "./types"

function readProfileValue(
  profile: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = profile[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (!Array.isArray(value)) continue
    const joined = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean)
      .join("\n")
    if (joined) return joined
  }
  return ""
}

export function resolveLegacyPublicProfileSectionContent(
  profile: Record<string, unknown>,
  section: RoadmapSection
): string {
  if (
    section.id === "mission_vision_values" ||
    section.id === "vision" ||
    section.id === "values"
  ) {
    if (section.lastUpdated !== null) return section.content
    return readProfileValue(
      profile,
      section.id === "mission_vision_values" ? "mission" : section.id
    )
  }
  if (section.id === "origin_story") {
    return readProfileValue(profile, "origin_story", "originStory")
  }
  if (section.id === "need") {
    return readProfileValue(profile, "need", "needStatement", "need_statement")
  }
  if (section.id === "theory_of_change") {
    return readProfileValue(profile, "theory_of_change", "theoryOfChange")
  }
  return ""
}
