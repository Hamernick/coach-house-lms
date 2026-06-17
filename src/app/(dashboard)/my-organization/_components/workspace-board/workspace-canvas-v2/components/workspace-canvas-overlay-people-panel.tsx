"use client"

import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import {
  PERSON_CATEGORY_OPTIONS,
  type PersonCategory,
} from "@/lib/people/categories"

import {
  WORKSPACE_PERSON_DRAG_TYPE,
  writeWorkspaceCanvasPersonDragPayload,
} from "./workspace-canvas-people-dnd"
import type {
  WorkspaceCategoryPeopleSegment,
  WorkspaceCustomPeopleSegment,
  WorkspacePeopleSegment,
} from "./workspace-canvas-people-segment-types"
import { WorkspacePeopleDrawerControls } from "./workspace-canvas-overlay-people-controls"
import { WorkspacePeopleSegmentContentHeader } from "./workspace-canvas-people-segment-content-header"
import { WorkspacePeopleDrawerTable } from "./workspace-canvas-overlay-people-table"
import { WorkspacePeopleSegmentRail } from "./workspace-canvas-people-segment-rail"

function buildPeopleSegments({
  people,
  customSegments,
}: {
  people: OrgPersonWithImage[]
  customSegments: WorkspaceCustomPeopleSegment[]
}): WorkspacePeopleSegment[] {
  const categoryCounts = new Map<PersonCategory, number>()
  for (const person of people) {
    categoryCounts.set(
      person.category,
      (categoryCounts.get(person.category) ?? 0) + 1
    )
  }

  return [
    {
      id: "all",
      kind: "all",
      label: "All",
      count: people.length,
    },
    ...PERSON_CATEGORY_OPTIONS.flatMap<WorkspaceCategoryPeopleSegment>(
      (option) => {
        const count = categoryCounts.get(option.value) ?? 0
        if (count === 0) return []
        return [
          {
            id: `category-${option.value}`,
            kind: "category",
            label: option.label,
            category: option.value,
            count,
          },
        ]
      }
    ),
    ...customSegments.map((segment) => ({
      ...segment,
      count: segment.memberIds.length,
    })),
  ]
}

function resolveSegmentPeople({
  people,
  segment,
}: {
  people: OrgPersonWithImage[]
  segment: WorkspacePeopleSegment
}) {
  if (segment.kind === "all") return people
  if (segment.kind === "category") {
    return people.filter((person) => person.category === segment.category)
  }

  const memberIds = new Set(segment.memberIds)
  return people.filter((person) => memberIds.has(person.id))
}

function personMatchesSearch(person: OrgPersonWithImage, query: string) {
  if (!query) return true

  const categoryLabel =
    PERSON_CATEGORY_OPTIONS.find((option) => option.value === person.category)
      ?.label ?? person.category
  const searchable = [
    person.name,
    person.title,
    person.email,
    person.category,
    categoryLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return searchable.includes(query)
}

function personMatchesCategory(
  person: OrgPersonWithImage,
  categoryFilter: PersonCategory | "all"
) {
  return categoryFilter === "all" || person.category === categoryFilter
}

export const WorkspacePeopleDrawerPanel = memo(
  function WorkspacePeopleDrawerPanel({
    people,
    viewerId,
    placedPersonIds,
    canEdit,
    onAddPeopleToCanvas,
  }: {
    people: OrgPersonWithImage[]
    viewerId: string
    placedPersonIds: ReadonlySet<string>
    canEdit: boolean
    onAddPeopleToCanvas: (personIds: string[]) => number
  }) {
    const nextSegmentIdRef = useRef(1)
    const [selectedSegmentId, setSelectedSegmentId] = useState("all")
    const [customSegments, setCustomSegments] = useState<
      WorkspaceCustomPeopleSegment[]
    >([])
    const [editingSegmentId, setEditingSegmentId] = useState<string | null>(
      null
    )
    const [draggingPersonId, setDraggingPersonId] = useState<string | null>(
      null
    )
    const [peopleSearch, setPeopleSearch] = useState("")
    const [peopleCategoryFilter, setPeopleCategoryFilter] = useState<
      PersonCategory | "all"
    >("all")
    const [, startSegmentTransition] = useTransition()
    const deferredPeopleSearch = useDeferredValue(peopleSearch)
    const normalizedPeopleSearch = deferredPeopleSearch.trim().toLowerCase()

    const segments = useMemo(
      () => buildPeopleSegments({ people, customSegments }),
      [customSegments, people]
    )
    const selectedSegment = useMemo(
      () =>
        segments.find((segment) => segment.id === selectedSegmentId) ??
        segments[0],
      [segments, selectedSegmentId]
    )
    const selectedPeople = useMemo(
      () => resolveSegmentPeople({ people, segment: selectedSegment }),
      [people, selectedSegment]
    )
    const filteredSelectedPeople = useMemo(
      () =>
        selectedPeople.filter(
          (person) =>
            personMatchesCategory(person, peopleCategoryFilter) &&
            personMatchesSearch(person, normalizedPeopleSearch)
        ),
      [normalizedPeopleSearch, peopleCategoryFilter, selectedPeople]
    )
    const selectedCustomSegment =
      selectedSegment.kind === "custom" ? selectedSegment : null
    const availablePeople = useMemo(() => {
      if (!selectedCustomSegment) return []
      const selectedIds = new Set(selectedCustomSegment.memberIds)
      return people.filter((person) => !selectedIds.has(person.id))
    }, [people, selectedCustomSegment])
    const filteredAvailablePeople = useMemo(
      () =>
        availablePeople.filter(
          (person) =>
            personMatchesCategory(person, peopleCategoryFilter) &&
            personMatchesSearch(person, normalizedPeopleSearch)
        ),
      [availablePeople, normalizedPeopleSearch, peopleCategoryFilter]
    )

    const handleSegmentChange = useCallback(
      (segmentId: string) => {
        startSegmentTransition(() => {
          setSelectedSegmentId(segmentId)
        })
      },
      [startSegmentTransition]
    )

    const updateCustomSegmentMembers = useCallback(
      (segmentId: string, nextMemberIds: (current: string[]) => string[]) => {
        setCustomSegments((current) =>
          current.map((segment) =>
            segment.id === segmentId
              ? {
                  ...segment,
                  memberIds: nextMemberIds(segment.memberIds),
                }
              : segment
          )
        )
      },
      []
    )

    const handleCreateSegment = useCallback(() => {
      const nextId = `custom-${nextSegmentIdRef.current}`
      const nextLabel = `Segment ${nextSegmentIdRef.current}`
      nextSegmentIdRef.current += 1
      setCustomSegments((current) => [
        ...current,
        {
          id: nextId,
          kind: "custom",
          label: nextLabel,
          memberIds: [],
          count: 0,
        },
      ])
      setSelectedSegmentId(nextId)
      setEditingSegmentId(nextId)
    }, [])

    const handleRenameSegment = useCallback(
      (segmentId: string, label: string) => {
        setCustomSegments((current) =>
          current.map((segment) =>
            segment.id === segmentId
              ? {
                  ...segment,
                  label: label.trim() || segment.label,
                }
              : segment
          )
        )
        setEditingSegmentId(null)
      },
      []
    )

    const handleRemoveSegment = useCallback((segmentId: string) => {
      setCustomSegments((current) =>
        current.filter((segment) => segment.id !== segmentId)
      )
      setSelectedSegmentId((current) =>
        current === segmentId ? "all" : current
      )
      setEditingSegmentId((current) => (current === segmentId ? null : current))
    }, [])

    const handleAddPerson = useCallback(
      (personId: string) => {
        if (!selectedCustomSegment) return
        updateCustomSegmentMembers(selectedCustomSegment.id, (current) =>
          current.includes(personId) ? current : [...current, personId]
        )
      },
      [selectedCustomSegment, updateCustomSegmentMembers]
    )

    const handleRemovePerson = useCallback(
      (personId: string) => {
        if (!selectedCustomSegment) return
        updateCustomSegmentMembers(selectedCustomSegment.id, (current) =>
          current.filter((id) => id !== personId)
        )
      },
      [selectedCustomSegment, updateCustomSegmentMembers]
    )

    const handlePersonDragStart = useCallback(
      (personIds: string[], event: DragEvent<HTMLElement>) => {
        const primaryPersonId = personIds[0]
        if (!primaryPersonId) return

        event.dataTransfer.effectAllowed = "copy"
        event.dataTransfer.setData(WORKSPACE_PERSON_DRAG_TYPE, primaryPersonId)
        writeWorkspaceCanvasPersonDragPayload(event.dataTransfer, personIds)
        setDraggingPersonId(primaryPersonId)
      },
      []
    )
    const handlePersonDragEnd = useCallback(() => {
      setDraggingPersonId(null)
    }, [])

    const handlePersonDrop = useCallback(
      (segmentId: string, event: DragEvent<HTMLElement>) => {
        event.preventDefault()
        event.stopPropagation()
        const personId =
          event.dataTransfer.getData(WORKSPACE_PERSON_DRAG_TYPE) ||
          draggingPersonId
        if (!personId) return
        updateCustomSegmentMembers(segmentId, (current) =>
          current.includes(personId) ? current : [...current, personId]
        )
        setSelectedSegmentId(segmentId)
        setDraggingPersonId(null)
      },
      [draggingPersonId, updateCustomSegmentMembers]
    )

    const handleSegmentDragOver = useCallback(
      (segment: WorkspacePeopleSegment, event: DragEvent<HTMLElement>) => {
        if (segment.kind !== "custom") return
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = "copy"
      },
      []
    )

    return (
      <div className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-border/60 w-full min-w-0 shrink-0 border-b px-2 py-3 sm:px-3">
          <div className="flex min-w-0 items-center gap-2">
            <WorkspacePeopleSegmentRail
              segments={segments}
              selectedSegmentId={selectedSegment.id}
              editingSegmentId={editingSegmentId}
              draggingPersonId={draggingPersonId}
              canManageSegments
              onSegmentChange={handleSegmentChange}
              onCreateSegment={handleCreateSegment}
              onRenameSegment={handleRenameSegment}
              onCancelEditSegment={() => setEditingSegmentId(null)}
              onSegmentDragOver={handleSegmentDragOver}
              onPersonDrop={handlePersonDrop}
            />
          </div>
        </div>

        <ScrollArea
          className="min-h-0 w-full max-w-full min-w-0 flex-1 overflow-hidden"
          viewportClassName="h-full max-w-full overscroll-contain touch-pan-y [&>div]:!block [&>div]:!w-full [&>div]:!max-w-full [&>div]:!min-w-0"
          contentClassName="flex min-h-full max-w-full flex-col gap-3 p-2 sm:p-3 [&>*]:min-w-0 [&>*]:max-w-full"
        >
          {people.length === 0 ? (
            <div className="border-border/70 text-muted-foreground grid min-h-48 place-items-center rounded-2xl border border-dashed px-6 text-center text-sm">
              No people yet.
            </div>
          ) : null}

          {people.length > 0 ? (
            <WorkspacePeopleDrawerControls
              people={people}
              canEdit={canEdit}
              searchValue={peopleSearch}
              onSearchChange={setPeopleSearch}
              categoryFilter={peopleCategoryFilter}
              onCategoryFilterChange={setPeopleCategoryFilter}
            />
          ) : null}

          {selectedCustomSegment ? (
            <WorkspacePeopleSegmentContentHeader
              segment={selectedCustomSegment}
              canManageSegments
              onEditSegment={setEditingSegmentId}
              onRemoveSegment={handleRemoveSegment}
            />
          ) : null}

          {people.length > 0 &&
          normalizedPeopleSearch &&
          filteredSelectedPeople.length === 0 &&
          (!selectedCustomSegment || filteredAvailablePeople.length === 0) ? (
            <div className="border-border/70 text-muted-foreground grid min-h-32 place-items-center rounded-2xl border border-dashed px-6 text-center text-sm">
              No people match your search.
            </div>
          ) : null}

          {selectedCustomSegment && filteredSelectedPeople.length > 0 ? (
            <WorkspacePeopleDrawerTable
              people={filteredSelectedPeople}
              allPeople={people}
              viewerId={viewerId}
              placedPersonIds={placedPersonIds}
              customSegment={selectedCustomSegment}
              canEdit={canEdit}
              label={`${selectedCustomSegment.label} members`}
              onDragStart={handlePersonDragStart}
              onDragEnd={handlePersonDragEnd}
              onAdd={handleAddPerson}
              onRemove={handleRemovePerson}
              onAddPeopleToCanvas={onAddPeopleToCanvas}
            />
          ) : null}

          {!selectedCustomSegment && filteredSelectedPeople.length > 0 ? (
            <WorkspacePeopleDrawerTable
              people={filteredSelectedPeople}
              allPeople={people}
              viewerId={viewerId}
              placedPersonIds={placedPersonIds}
              customSegment={null}
              canEdit={canEdit}
              label={`${selectedSegment.label} people`}
              onDragStart={handlePersonDragStart}
              onDragEnd={handlePersonDragEnd}
              onAdd={handleAddPerson}
              onRemove={handleRemovePerson}
              onAddPeopleToCanvas={onAddPeopleToCanvas}
            />
          ) : null}

          {selectedCustomSegment && filteredAvailablePeople.length > 0 ? (
            <WorkspacePeopleDrawerTable
              people={filteredAvailablePeople}
              allPeople={people}
              viewerId={viewerId}
              placedPersonIds={placedPersonIds}
              customSegment={selectedCustomSegment}
              canEdit={canEdit}
              label={`People available for ${selectedCustomSegment.label}`}
              onDragStart={handlePersonDragStart}
              onDragEnd={handlePersonDragEnd}
              onAdd={handleAddPerson}
              onRemove={handleRemovePerson}
              onAddPeopleToCanvas={onAddPeopleToCanvas}
            />
          ) : null}
        </ScrollArea>
      </div>
    )
  }
)
