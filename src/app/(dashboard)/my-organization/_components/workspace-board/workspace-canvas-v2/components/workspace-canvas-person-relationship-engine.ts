import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

export type WorkspaceCanvasPersonRelationshipKind = "reports-to"

export type WorkspaceCanvasPersonRelationship = {
  id: string
  kind: WorkspaceCanvasPersonRelationshipKind
  sourcePersonId: string
  targetPersonId: string
}

const WORKSPACE_PERSON_RELATIONSHIP_MAX_MANAGER_DEPTH = 6
const WORKSPACE_PERSON_LEADERSHIP_TITLE_PATTERN =
  /\b(founder|executive|director|president|chief|ceo|coo|cto|head|lead|chair)\b/i

export function normalizeWorkspaceCanvasPersonIds(personIds: string[]) {
  return Array.from(
    new Set(personIds.map((personId) => personId.trim()).filter(Boolean))
  )
}

export function resolveWorkspaceCanvasPersonReportsToId(
  person: OrgPersonWithImage | undefined
) {
  const reportsToId = person?.reportsToId?.trim()
  if (!reportsToId || reportsToId === person?.id) return null
  return reportsToId
}

function compareWorkspacePeopleByName(
  left: OrgPersonWithImage,
  right: OrgPersonWithImage
) {
  return left.name.localeCompare(right.name)
}

function hasWorkspaceLeadershipTitle(person: OrgPersonWithImage) {
  const title = person.title?.trim() ?? ""
  return WORKSPACE_PERSON_LEADERSHIP_TITLE_PATTERN.test(title)
}

function resolveWorkspaceCanvasLeadStaffPerson(
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
) {
  const staff = Array.from(peopleById.values())
    .filter((person) => person.category === "staff")
    .sort(compareWorkspacePeopleByName)
  const staffWithoutExplicitManager = staff.filter(
    (person) => !resolveWorkspaceCanvasPersonReportsToId(person)
  )

  return (
    staffWithoutExplicitManager.find(hasWorkspaceLeadershipTitle) ??
    staff.find(hasWorkspaceLeadershipTitle) ??
    staffWithoutExplicitManager[0] ??
    staff[0] ??
    null
  )
}

export function buildWorkspaceCanvasPersonManagerByPersonId({
  personIds,
  peopleById,
}: {
  personIds: string[]
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
}) {
  const graphPersonIds = normalizeWorkspaceCanvasPersonIds(personIds).filter(
    (personId) => peopleById.has(personId)
  )
  const graphPersonIdSet = new Set(graphPersonIds)
  const leadStaffPerson = resolveWorkspaceCanvasLeadStaffPerson(peopleById)
  const managerByPersonId = new Map<string, string>()

  for (const personId of graphPersonIds) {
    const person = peopleById.get(personId)
    if (!person) continue

    const explicitManagerId = resolveWorkspaceCanvasPersonReportsToId(person)
    if (explicitManagerId && graphPersonIdSet.has(explicitManagerId)) {
      managerByPersonId.set(personId, explicitManagerId)
      continue
    }

    if (
      person.category === "staff" &&
      leadStaffPerson &&
      leadStaffPerson.id !== person.id &&
      graphPersonIdSet.has(leadStaffPerson.id)
    ) {
      managerByPersonId.set(personId, leadStaffPerson.id)
    }
  }

  return managerByPersonId
}

export function buildWorkspaceCanvasPersonRelationships({
  personIds,
  peopleById,
}: {
  personIds: string[]
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
}): WorkspaceCanvasPersonRelationship[] {
  const graphPersonIds = normalizeWorkspaceCanvasPersonIds(personIds).filter(
    (personId) => peopleById.has(personId)
  )
  const managerByPersonId = buildWorkspaceCanvasPersonManagerByPersonId({
    personIds: graphPersonIds,
    peopleById,
  })
  const relationships: WorkspaceCanvasPersonRelationship[] = []

  for (const personId of graphPersonIds) {
    const reportsToId = managerByPersonId.get(personId)
    if (!reportsToId) continue

    relationships.push({
      id: `reports-to:${personId}:${reportsToId}`,
      kind: "reports-to",
      sourcePersonId: personId,
      targetPersonId: reportsToId,
    })
  }

  return relationships
}

export function resolveWorkspacePeopleRelationshipGraphPersonIds({
  personIds,
  peopleById,
}: {
  personIds: string[]
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
}) {
  const requestedPersonIds = normalizeWorkspaceCanvasPersonIds(
    personIds
  ).filter((personId) => peopleById.has(personId))
  const graphPersonIds = new Set(requestedPersonIds)
  const leadStaffPerson = resolveWorkspaceCanvasLeadStaffPerson(peopleById)

  for (const requestedPersonId of requestedPersonIds) {
    let currentPersonId = requestedPersonId
    const visitedPersonIds = new Set([requestedPersonId])
    const requestedPerson = peopleById.get(requestedPersonId)

    if (
      requestedPerson?.category === "staff" &&
      !resolveWorkspaceCanvasPersonReportsToId(requestedPerson) &&
      leadStaffPerson &&
      leadStaffPerson.id !== requestedPersonId
    ) {
      graphPersonIds.add(leadStaffPerson.id)
    }

    for (
      let depth = 0;
      depth < WORKSPACE_PERSON_RELATIONSHIP_MAX_MANAGER_DEPTH;
      depth += 1
    ) {
      const reportsToId = resolveWorkspaceCanvasPersonReportsToId(
        peopleById.get(currentPersonId)
      )
      if (!reportsToId || !peopleById.has(reportsToId)) break
      if (visitedPersonIds.has(reportsToId)) break

      graphPersonIds.add(reportsToId)
      visitedPersonIds.add(reportsToId)
      currentPersonId = reportsToId
    }
  }

  return Array.from(graphPersonIds)
}
