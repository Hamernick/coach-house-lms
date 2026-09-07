import type {
  DocumentationDecisionGraph,
  DocumentationDecisionStep,
} from "../types"

/** Dependencies describe planning order, never a validation or eligibility gate. */
export function buildDocumentationDecisionGraph(
  steps: DocumentationDecisionStep[],
  vertical = false
): DocumentationDecisionGraph {
  const levels = new Map<string, number>()
  const edges: DocumentationDecisionGraph["edges"] = []
  for (const [index, step] of steps.entries()) {
    if (levels.has(step.id))
      throw new Error(`Duplicate decision step: ${step.id}`)
    const parents = step.dependsOn ?? (index ? [steps[index - 1].id] : [])
    for (const source of parents) {
      if (!levels.has(source))
        throw new Error(`Decision step ${step.id} must follow ${source}`)
      edges.push({ id: `${source}-${step.id}`, source, target: step.id })
    }
    levels.set(
      step.id,
      parents.length ? 1 + Math.max(...parents.map((id) => levels.get(id)!)) : 0
    )
  }
  const columns = new Map<number, string[]>()
  for (const step of steps) {
    const level = levels.get(step.id)!
    columns.set(level, [...(columns.get(level) ?? []), step.id])
  }
  return {
    edges,
    steps: steps.map((step, index) => {
      const level = levels.get(step.id)!
      const peers = columns.get(level)!
      const row = peers.indexOf(step.id) - (peers.length - 1) / 2
      return {
        ...step,
        // A vertical reading order keeps every mobile node at a usable size.
        position: vertical
          ? { x: 0, y: index * 150 }
          : { x: level * 296, y: row * 152 },
        incoming: edges.some((edge) => edge.target === step.id),
        outgoing: edges.some((edge) => edge.source === step.id),
      }
    }),
  }
}

export function invalidateDecisionReview(
  reviewed: string[],
  changedId: string,
  steps: DocumentationDecisionStep[]
) {
  const affected = new Set([changedId])
  for (const edge of buildDocumentationDecisionGraph(steps).edges) {
    if (affected.has(edge.source)) affected.add(edge.target)
  }
  return reviewed.filter((id) => !affected.has(id))
}

/** A local change marker; no draft text is duplicated in progress storage. */
export function decisionDraftRevision(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return `${value.length}:${hash >>> 0}`
}

export function readDecisionReview(
  value: string | null,
  revision: string,
  ids: string[]
) {
  try {
    const saved: unknown = JSON.parse(value ?? "null")
    if (
      !saved ||
      typeof saved !== "object" ||
      !("revision" in saved) ||
      saved.revision !== revision ||
      !("reviewed" in saved) ||
      !Array.isArray(saved.reviewed)
    )
      return []
    const reviewed: unknown[] = saved.reviewed
    return ids.filter((id) => reviewed.includes(id))
  } catch {
    return []
  }
}
