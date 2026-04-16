import type { MemberWorkspaceSection } from "../types"

export {
  buildProjectAssetOpenPath,
  detectProjectAssetTypeFromName,
  detectProjectAssetTypeFromUrl,
  sanitizeProjectAssetFilename,
} from "./project-assets"

export const MEMBER_WORKSPACE_SECTIONS = [
  "projects",
  "my-tasks",
  "people",
] as const satisfies readonly MemberWorkspaceSection[]

export function getMemberWorkspaceSectionLabel(section: MemberWorkspaceSection) {
  switch (section) {
    case "projects":
      return "Projects"
    case "my-tasks":
      return "Tasks"
    case "people":
      return "People"
  }
}

export function isDonorAudience(
  intentFocus: "build" | "find" | "fund" | "support" | null,
) {
  return intentFocus === "fund"
}
