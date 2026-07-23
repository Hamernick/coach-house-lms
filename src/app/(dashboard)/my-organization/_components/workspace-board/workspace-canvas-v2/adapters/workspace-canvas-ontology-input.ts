import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyStatus,
} from "@/features/workspace-ontology"
import { getWorkspaceRoadmapSectionPath } from "@/lib/workspace/routes"

import type {
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerState,
} from "../../workspace-board-types"
import { buildWorkspaceAcceleratorOntologyRoot } from "./workspace-canvas-ontology-input-accelerator"
import {
  buildWorkspaceCalendarOntologyRoot,
  buildWorkspaceFiscalOntologyRoot,
} from "./workspace-canvas-ontology-input-operations"
import { buildWorkspaceOrganizationOntologyRoot } from "./workspace-canvas-ontology-input-organization"
import { buildWorkspaceProgramsOntologyRoot } from "./workspace-canvas-ontology-input-programs"

function statusFromProgress(
  status: "not_started" | "in_progress" | "complete" | "completed"
): WorkspaceOntologyStatus {
  if (status === "complete" || status === "completed") return "complete"
  if (status === "in_progress") return "in-progress"
  return "missing"
}

function statusLabel(status: WorkspaceOntologyStatus) {
  if (status === "complete") return "Complete"
  if (status === "in-progress") return "In progress"
  if (status === "blocked") return "Blocked"
  return "Missing information"
}

function buildRoadmapRoot(
  seed: WorkspaceSeedData
): WorkspaceOntologyInput["roots"][number] {
  return {
    id: "roadmap",
    label: "Roadmap",
    children: seed.roadmapSections.map((section) => {
      const status = statusFromProgress(section.status)
      return {
        id: `ontology:roadmap:${section.id}`,
        label: section.title,
        description: section.subtitle,
        category: "roadmap",
        kind: "Roadmap milestone",
        status,
        statusLabel: statusLabel(status),
        relationshipLabel: "sequences",
        href: getWorkspaceRoadmapSectionPath(section.slug),
        actionLabel: status === "complete" ? "Review" : "Continue",
        keywords: [section.slug, section.isPublic ? "public" : "private"],
      }
    }),
  }
}

function resolvePlacedStaffRootIds({
  editor,
  placedPersonIds,
}: {
  editor: WorkspaceOrganizationEditorData
  placedPersonIds: readonly string[]
}) {
  const placedIdSet = new Set(placedPersonIds)
  const reportsToByPersonId = new Map<string, string>()
  const reportsByManagerId = new Map<string, string[]>()
  for (const person of editor.people) {
    if (!placedIdSet.has(person.id)) continue
    const reportsToId = person.reportsToId?.trim()
    if (
      !reportsToId ||
      reportsToId === person.id ||
      !placedIdSet.has(reportsToId)
    ) {
      continue
    }
    reportsToByPersonId.set(person.id, reportsToId)
    reportsByManagerId.set(reportsToId, [
      ...(reportsByManagerId.get(reportsToId) ?? []),
      person.id,
    ])
  }

  const orderedCandidates = [
    ...placedPersonIds.filter((personId) => !reportsToByPersonId.has(personId)),
    ...placedPersonIds,
  ]
  const visited = new Set<string>()
  const rootIds: string[] = []
  for (const candidateId of orderedCandidates) {
    if (visited.has(candidateId)) continue
    rootIds.push(candidateId)
    const pending = [candidateId]
    while (pending.length > 0) {
      const personId = pending.pop()
      if (!personId || visited.has(personId)) continue
      visited.add(personId)
      pending.push(...(reportsByManagerId.get(personId) ?? []))
    }
  }
  return rootIds
}

export function buildWorkspaceCanvasOntologyInput({
  seed,
  editor,
  tracker = seed.boardState.tracker,
  placedPersonIds = [],
}: {
  seed: WorkspaceSeedData
  editor: WorkspaceOrganizationEditorData
  tracker?: WorkspaceTrackerState
  placedPersonIds?: readonly string[]
}): WorkspaceOntologyInput {
  const uniquePlacedPersonIds = Array.from(
    new Set(placedPersonIds.map((personId) => personId.trim()).filter(Boolean))
  )
  const placedStaffRootIds = resolvePlacedStaffRootIds({
    editor,
    placedPersonIds: uniquePlacedPersonIds,
  })
  return {
    roots: [
      buildWorkspaceOrganizationOntologyRoot({ editor }),
      buildWorkspaceProgramsOntologyRoot({ seed, editor, tracker }),
      buildWorkspaceAcceleratorOntologyRoot(seed),
      buildRoadmapRoot(seed),
      buildWorkspaceCalendarOntologyRoot(seed),
      buildWorkspaceFiscalOntologyRoot(editor),
    ],
    relationships: [
      ...placedStaffRootIds.map((personId) => ({
        id: `ontology-relationship:organization-person:${personId}`,
        source: "ontology:organization:people",
        target: `workspace-person:${personId}`,
        label: "staffed by",
        category: "people" as const,
        status: "complete" as const,
      })),
      ...seed.calendar.upcomingEvents.map((event) => ({
        id: `ontology-relationship:activity-calendar:${event.id}`,
        source: "ontology:programs:activity",
        target: `ontology:calendar:${event.id}`,
        label: "scheduled as",
        category: "calendar" as const,
        status: "in-progress" as const,
      })),
      {
        id: "ontology-relationship:programs-tasks",
        source: "ontology:programs:portfolio",
        target: "ontology:tasks:portfolio",
        label: "executed through",
        category: "tasks",
        status: "in-progress",
      },
      {
        id: "ontology-relationship:programs-fiscal",
        source: "ontology:programs:portfolio",
        target: "ontology:fiscal:application",
        label: "funded through",
        category: "fiscal",
        status: "in-progress",
      },
    ],
  }
}
