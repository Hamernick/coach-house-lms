import type { OrgDocuments } from "../../../types"
import { DOCUMENTS } from "../constants"
import {
  mapPolicyStatus,
  mapRoadmapStatus,
  normalizeCategories,
  resolveRoadmapCategory,
} from "../helpers"
import type {
  DocumentsPolicyEntry,
  DocumentsRoadmapSection,
  PolicyRow,
  RoadmapRow,
  UploadRow,
} from "../types"

export function buildUploadRows(documentsState: OrgDocuments): UploadRow[] {
  return DOCUMENTS.map((definition) => {
    const document = documentsState?.[definition.key] ?? null
    return {
      id: `upload:${definition.kind}`,
      source: "upload",
      name: definition.title,
      description: definition.description,
      categories: [definition.category],
      status: document?.path ? "ready" : "missing",
      visibility: "private",
      updatedAt: document?.updatedAt ?? null,
      definition,
      document,
    }
  })
}

type BuildPolicyRowsArgs = {
  policiesState: DocumentsPolicyEntry[]
  programLabelById: Map<string, string>
  peopleLabelById: Map<string, string>
}

export function buildPolicyRows({
  policiesState,
  programLabelById,
  peopleLabelById,
}: BuildPolicyRowsArgs): PolicyRow[] {
  return policiesState.map((policy) => {
    const associations: string[] = []
    if (policy.categories.length > 0) {
      associations.push(`Categories: ${policy.categories.join(", ")}`)
    }
    if (policy.programId && programLabelById.get(policy.programId)) {
      associations.push(`Program: ${programLabelById.get(policy.programId)}`)
    }
    const peopleLabels = policy.personIds
      .map((personId) => peopleLabelById.get(personId))
      .filter((value): value is string => Boolean(value))
    if (peopleLabels.length > 0) associations.push(`People: ${peopleLabels.join(", ")}`)

    const description = [
      policy.summary.trim(),
      associations.length > 0 ? associations.join(" · ") : "",
    ]
      .filter((value) => value.length > 0)
      .join("\n")

    return {
      id: `policy:${policy.id}`,
      source: "policy",
      name: policy.title,
      description,
      categories: normalizeCategories(["Policies", ...policy.categories]),
      status: mapPolicyStatus(policy),
      visibility: "private",
      updatedAt: policy.updatedAt,
      policy,
    }
  })
}

export function buildRoadmapRows(roadmapSections: DocumentsRoadmapSection[]): RoadmapRow[] {
  return roadmapSections.map((section) => ({
    id: `roadmap:${section.id}`,
    source: "roadmap",
    name: section.title,
    description: section.subtitle,
    categories: [resolveRoadmapCategory(section.id)],
    status: mapRoadmapStatus(section),
    visibility: section.isPublic ? "public" : "private",
    updatedAt: section.lastUpdated,
    section,
  }))
}
