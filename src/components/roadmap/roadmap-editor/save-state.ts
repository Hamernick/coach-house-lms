import type { RoadmapSection } from "@/lib/roadmap"
import { roadmapBudgetRowsEqual } from "@/lib/roadmap/budget"
import { createDraft, isRoadmapDraftDirty } from "./helpers"
import type { RoadmapDraft } from "./types"

export function mergeSavedRoadmapDraft(
  section: RoadmapSection,
  submitted: RoadmapDraft,
  current: RoadmapDraft = submitted
): RoadmapDraft {
  const next = createDraft(section)
  for (const field of ["title", "subtitle", "content", "imageUrl"] as const) {
    if (current[field] !== submitted[field]) next[field] = current[field]
  }
  if (!roadmapBudgetRowsEqual(current.budgetRows, submitted.budgetRows)) {
    next.budgetRows = current.budgetRows
  }
  return next
}

export function reconcileRoadmapEditorSections(
  incoming: RoadmapSection[],
  current: RoadmapSection[],
  drafts: Record<string, RoadmapDraft>
) {
  const currentById = new Map(current.map((section) => [section.id, section]))
  const nextDrafts: Record<string, RoadmapDraft> = {}
  const sections = incoming.map((section) => {
    const previous = currentById.get(section.id)
    const draft = drafts[section.id]
    const previousIsNewer =
      (Date.parse(previous?.lastUpdated ?? "") || 0) >
      (Date.parse(section.lastUpdated ?? "") || 0)
    // Keep a dirty draft tied to the revision it was edited against. Adopting
    // a remote revision here would let the next save overwrite unseen edits.
    if (
      previous &&
      draft &&
      (previousIsNewer || isRoadmapDraftDirty(previous, draft))
    ) {
      nextDrafts[section.id] = draft
      return previous
    }
    nextDrafts[section.id] = createDraft(section)
    return section
  })
  return { sections, drafts: nextDrafts }
}
