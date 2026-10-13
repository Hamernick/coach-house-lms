"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"

import { toast } from "@/lib/toast"

import {
  createWorkspaceObjectiveAction,
  createWorkspaceObjectiveGroupAction,
  loadWorkspaceObjectivesAction,
  setWorkspaceObjectiveAssigneesAction,
  setWorkspaceObjectiveDetailsAction,
  setWorkspaceObjectiveGroupArchivedAction,
  setWorkspaceObjectiveStatusAction,
} from "../../_lib/workspace-objectives-actions"
import {
  createLocalCategoryState,
  createLocalTicketState,
  isLegacyOrRuntimeTrackerId,
  sortTrackerTickets,
  toggleLocalCategoryArchiveState,
  toggleLocalTicketStatusState,
  trimToSingleLine,
  updateLocalTicketState,
} from "./workspace-board-formation-tracker-card-helpers"
import { resolveNextTicketStatus } from "./workspace-board-formation-tracker-card-ui"
import {
  mapObjectiveCollectionToTrackerState,
  mapTrackerStatusToObjectiveStatus,
} from "./workspace-board-objectives-bridge"
import type {
  WorkspaceSeedData,
  WorkspaceTrackerState,
  WorkspaceTrackerTicket,
  WorkspaceTrackerTicketPriority,
} from "./workspace-board-types"

export type AcceleratorGroup = {
  id: string
  title: string
  modules: WorkspaceSeedData["formationSummary"]["visibleModules"]
}

function toDateInputValue(value: string | null) {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

function applyCreateCategoryLocal({
  tracker,
  title,
  commitTracker,
  setDraftTicketCategoryId,
  setDraftCategoryTitle,
}: {
  tracker: WorkspaceTrackerState
  title: string
  commitTracker: (next: WorkspaceTrackerState) => void
  setDraftTicketCategoryId: (value: string) => void
  setDraftCategoryTitle: (value: string) => void
}) {
  const { nextState, nextCategoryId } = createLocalCategoryState({ tracker, title })
  commitTracker(nextState)
  setDraftTicketCategoryId(nextCategoryId)
  setDraftCategoryTitle("")
}

function applyCreateTicketLocal({
  tracker,
  categoryId,
  title,
  description,
  priority,
  dueAt,
  assigneeUserIds,
  commitTracker,
  setDraftTicketTitle,
  setDraftTicketDescription,
  setDraftTicketPriority,
  setDraftTicketDueDate,
  setDraftTicketAssigneeId,
}: {
  tracker: WorkspaceTrackerState
  categoryId: string
  title: string
  description: string | null
  priority: WorkspaceTrackerTicketPriority
  dueAt: string | null
  assigneeUserIds: string[]
  commitTracker: (next: WorkspaceTrackerState) => void
  setDraftTicketTitle: (value: string) => void
  setDraftTicketDescription: (value: string) => void
  setDraftTicketPriority: (value: WorkspaceTrackerTicketPriority) => void
  setDraftTicketDueDate: (value: string) => void
  setDraftTicketAssigneeId: (value: string) => void
}) {
  commitTracker(
    createLocalTicketState({
      tracker,
      categoryId,
      title,
      description,
      priority,
      dueAt,
      assigneeUserIds,
    }),
  )
  setDraftTicketTitle("")
  setDraftTicketDescription("")
  setDraftTicketPriority("normal")
  setDraftTicketDueDate("")
  setDraftTicketAssigneeId("")
}

function useWorkspaceObjectiveEditorState({
  members,
  activeCategories,
  tracker,
  canManageObjectives,
  objectivesMode,
  commitTracker,
  refreshObjectives,
  startObjectivesSync,
}: {
  members: WorkspaceSeedData["members"]
  activeCategories: WorkspaceTrackerState["categories"]
  tracker: WorkspaceTrackerState
  canManageObjectives: boolean
  objectivesMode: "unknown" | "normalized" | "legacy"
  commitTracker: (next: WorkspaceTrackerState) => void
  refreshObjectives: (tab: WorkspaceTrackerState["tab"]) => void
  startObjectivesSync: (action: () => Promise<void>) => void
}) {
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriority, setEditPriority] = useState<WorkspaceTrackerTicketPriority>("normal")
  const [editDueDate, setEditDueDate] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([])

  const openTicketEditor = (ticketId: string) => {
    const ticket = tracker.tickets.find((entry) => entry.id === ticketId)
    if (!ticket) return
    setEditingTicketId(ticket.id)
    setEditTitle(ticket.title)
    setEditDescription(ticket.description ?? "")
    setEditPriority(ticket.priority)
    setEditDueDate(toDateInputValue(ticket.dueAt))
    setEditCategoryId(ticket.categoryId)
    setEditAssigneeIds(ticket.assigneeUserIds)
  }

  const closeTicketEditor = () => {
    setEditingTicketId(null)
    setEditTitle("")
    setEditDescription("")
    setEditPriority("normal")
    setEditDueDate("")
    setEditCategoryId("")
    setEditAssigneeIds([])
  }

  const toggleEditAssignee = (userId: string) => {
    setEditAssigneeIds((previous) =>
      previous.includes(userId) ? previous.filter((entry) => entry !== userId) : [...previous, userId],
    )
  }

  const saveTicketEdits = () => {
    if (!editingTicketId) return
    const normalizedTitle = trimToSingleLine(editTitle)
    if (!normalizedTitle) return

    const normalizedDescription = editDescription.trim() || null
    const normalizedDueAt = editDueDate ? new Date(`${editDueDate}T12:00:00.000Z`).toISOString() : null
    const normalizedCategoryId = editCategoryId || activeCategories[0]?.id || "general"

    if (
      !canManageObjectives ||
      objectivesMode !== "normalized" ||
      isLegacyOrRuntimeTrackerId(editingTicketId)
    ) {
      commitTracker(
        updateLocalTicketState({
          tracker,
          ticketId: editingTicketId,
          updates: {
            title: normalizedTitle,
            description: normalizedDescription,
            priority: editPriority,
            dueAt: normalizedDueAt,
            categoryId: normalizedCategoryId,
            assigneeUserIds: editAssigneeIds,
          },
        }),
      )
      closeTicketEditor()
      return
    }

    startObjectivesSync(async () => {
      const detailsResult = await setWorkspaceObjectiveDetailsAction({
        objectiveId: editingTicketId,
        title: normalizedTitle,
        description: normalizedDescription,
        priority: editPriority,
        dueAt: normalizedDueAt,
        groupId: normalizedCategoryId,
      })
      if (!detailsResult.ok) {
        toast.error(detailsResult.error)
        return
      }

      const assigneesResult = await setWorkspaceObjectiveAssigneesAction({
        objectiveId: editingTicketId,
        userIds: editAssigneeIds,
      })
      if (!assigneesResult.ok) {
        toast.error(assigneesResult.error)
        return
      }

      closeTicketEditor()
      refreshObjectives("objectives")
    })
  }

  useEffect(() => {
    if (!editingTicketId) return
    const ticket = tracker.tickets.find((entry) => entry.id === editingTicketId)
    if (!ticket) {
      closeTicketEditor()
      return
    }
    const allowedCategoryIds = new Set(activeCategories.map((category) => category.id))
    if (!allowedCategoryIds.has(editCategoryId)) {
      setEditCategoryId(ticket.categoryId)
    }
    const allowedMemberIds = new Set(members.map((member) => member.userId))
    setEditAssigneeIds((previous) => previous.filter((userId) => allowedMemberIds.has(userId)))
  }, [activeCategories, editCategoryId, editingTicketId, members, tracker.tickets])

  return {
    editingTicketId,
    editTitle,
    editDescription,
    editPriority,
    editDueDate,
    editCategoryId,
    editAssigneeIds,
    setEditTitle,
    setEditDescription,
    setEditPriority,
    setEditDueDate,
    setEditCategoryId,
    openTicketEditor,
    closeTicketEditor,
    toggleEditAssignee,
    saveTicketEdits,
  }
}

export function useWorkspaceBoardFormationTrackerController({
  seed,
  presentationMode,
  tracker,
  onTrackerChange,
}: {
  seed: WorkspaceSeedData
  presentationMode: boolean
  tracker: WorkspaceTrackerState
  onTrackerChange: (next: WorkspaceTrackerState) => void
}) {
  const canManageObjectives = seed.canEdit && !presentationMode
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [draftCategoryTitle, setDraftCategoryTitle] = useState("")
  const [draftTicketTitle, setDraftTicketTitle] = useState("")
  const [draftTicketDescription, setDraftTicketDescription] = useState("")
  const [draftTicketPriority, setDraftTicketPriority] = useState<WorkspaceTrackerTicketPriority>("normal")
  const [draftTicketDueDate, setDraftTicketDueDate] = useState("")
  const [draftTicketAssigneeId, setDraftTicketAssigneeId] = useState("")
  const [draftTicketCategoryId, setDraftTicketCategoryId] = useState("")
  const [ticketQuery, setTicketQuery] = useState("")
  const [ticketStatusFilter, setTicketStatusFilter] = useState<"all" | "open" | "done">("all")
  const [objectivesMode, setObjectivesMode] = useState<"unknown" | "normalized" | "legacy">("unknown")
  const [isSyncingObjectives, startObjectivesSync] = useTransition()
  const didHydrateObjectivesRef = useRef(false)

  const acceleratorGroups = useMemo<AcceleratorGroup[]>(() => {
    const next: AcceleratorGroup[] = []
    if (seed.formationSummary.visibleModules.length > 0) {
      next.push({ id: "formation", title: "Formation", modules: seed.formationSummary.visibleModules })
    }
    if (seed.formationSummary.acceleratorModules.length > 0) {
      next.push({ id: "electives", title: "Electives", modules: seed.formationSummary.acceleratorModules })
    }
    return next
  }, [seed.formationSummary.acceleratorModules, seed.formationSummary.visibleModules])

  const activeCategories = tracker.categories.filter((category) => !category.archived)
  const archivedCategories = tracker.categories.filter((category) => category.archived)

  useEffect(() => {
    if (draftTicketCategoryId && activeCategories.some((category) => category.id === draftTicketCategoryId)) {
      return
    }
    setDraftTicketCategoryId(activeCategories[0]?.id ?? "")
  }, [activeCategories, draftTicketCategoryId])

  useEffect(() => {
    if (!draftTicketAssigneeId) return
    const exists = seed.members.some((member) => member.userId === draftTicketAssigneeId)
    if (!exists) setDraftTicketAssigneeId("")
  }, [draftTicketAssigneeId, seed.members])

  const ticketsByCategory = useMemo(() => {
    const map = new Map<string, WorkspaceTrackerTicket[]>()
    const sortedTickets = sortTrackerTickets(tracker.tickets)
    for (const ticket of sortedTickets) {
      if (ticket.archived) continue
      const list = map.get(ticket.categoryId) ?? []
      list.push(ticket)
      map.set(ticket.categoryId, list)
    }
    return map
  }, [tracker.tickets])

  const openTicketCount = tracker.tickets.filter((ticket) => !ticket.archived && ticket.status !== "done").length
  const doneTicketCount = tracker.tickets.filter((ticket) => !ticket.archived && ticket.status === "done").length

  const commitTracker = useCallback(
    (next: WorkspaceTrackerState) => onTrackerChange(next),
    [onTrackerChange],
  )

  const refreshObjectives = useCallback((tabOverride: WorkspaceTrackerState["tab"]) => {
    startObjectivesSync(async () => {
      const result = await loadWorkspaceObjectivesAction()
      if (!result.ok) return

      if (result.data.loadedFrom === "normalized") setObjectivesMode("normalized")
      else setObjectivesMode("legacy")

      commitTracker(
        mapObjectiveCollectionToTrackerState({
          collection: result.data,
          tab: tabOverride,
        }),
      )
    })
  }, [commitTracker])

  useEffect(() => {
    if (didHydrateObjectivesRef.current) return
    didHydrateObjectivesRef.current = true
    refreshObjectives(tracker.tab)
  }, [refreshObjectives, tracker.tab])

  const setTab = (nextTab: WorkspaceTrackerState["tab"]) => {
    if (tracker.tab === nextTab) return
    commitTracker({ ...tracker, tab: nextTab })
  }

  const toggleSectionCollapsed = (sectionId: string) => {
    setCollapsedSections((previous) => ({ ...previous, [sectionId]: !previous[sectionId] }))
  }

  const toggleAcceleratorGroupArchive = (groupId: string) => {
    const archivedSet = new Set(tracker.archivedAcceleratorGroups)
    if (archivedSet.has(groupId)) archivedSet.delete(groupId)
    else archivedSet.add(groupId)
    commitTracker({
      ...tracker,
      archivedAcceleratorGroups: Array.from(archivedSet),
    })
  }

  const createCategory = () => {
    const nextTitle = trimToSingleLine(draftCategoryTitle)
    if (!nextTitle) return
    const exists = tracker.categories.some(
      (category) => category.title.toLowerCase() === nextTitle.toLowerCase(),
    )
    if (exists) {
      setDraftCategoryTitle("")
      return
    }

    if (!canManageObjectives || objectivesMode !== "normalized") {
      applyCreateCategoryLocal({
        tracker,
        title: nextTitle,
        commitTracker,
        setDraftTicketCategoryId,
        setDraftCategoryTitle,
      })
      return
    }

    startObjectivesSync(async () => {
      const result = await createWorkspaceObjectiveGroupAction({ title: nextTitle })
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setDraftCategoryTitle("")
      setDraftTicketCategoryId(result.data.id)
      refreshObjectives("objectives")
    })
  }

  const toggleCategoryArchive = (categoryId: string) => {
    const category = tracker.categories.find((entry) => entry.id === categoryId)
    if (!category) return

    if (
      !canManageObjectives ||
      objectivesMode !== "normalized" ||
      isLegacyOrRuntimeTrackerId(categoryId)
    ) {
      commitTracker(toggleLocalCategoryArchiveState({ tracker, categoryId }))
      return
    }

    startObjectivesSync(async () => {
      const result = await setWorkspaceObjectiveGroupArchivedAction({
        groupId: categoryId,
        archived: !category.archived,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      refreshObjectives("objectives")
    })
  }

  const createTicket = () => {
    const nextTitle = trimToSingleLine(draftTicketTitle)
    if (!nextTitle || !draftTicketCategoryId) return
    const nextDescription = draftTicketDescription.trim() || null
    const nextDueAt = draftTicketDueDate ? new Date(`${draftTicketDueDate}T12:00:00.000Z`).toISOString() : null

    const categoryExists = tracker.categories.some(
      (category) => category.id === draftTicketCategoryId && !category.archived,
    )
    if (!categoryExists) return

    if (!canManageObjectives || objectivesMode !== "normalized") {
      applyCreateTicketLocal({
        tracker,
        categoryId: draftTicketCategoryId,
        title: nextTitle,
        description: nextDescription,
        priority: draftTicketPriority,
        dueAt: nextDueAt,
        assigneeUserIds: draftTicketAssigneeId ? [draftTicketAssigneeId] : [],
        commitTracker,
        setDraftTicketTitle,
        setDraftTicketDescription,
        setDraftTicketPriority,
        setDraftTicketDueDate,
        setDraftTicketAssigneeId,
      })
      return
    }

    startObjectivesSync(async () => {
      const result = await createWorkspaceObjectiveAction({
        title: nextTitle,
        description: nextDescription,
        groupId: draftTicketCategoryId,
        priority: draftTicketPriority,
        dueAt: nextDueAt,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      if (draftTicketAssigneeId) {
        const assigneeResult = await setWorkspaceObjectiveAssigneesAction({
          objectiveId: result.data.id,
          userIds: [draftTicketAssigneeId],
        })
        if (!assigneeResult.ok) {
          toast.error(assigneeResult.error)
        }
      }

      setDraftTicketTitle("")
      setDraftTicketDescription("")
      setDraftTicketPriority("normal")
      setDraftTicketDueDate("")
      setDraftTicketAssigneeId("")
      refreshObjectives("objectives")
    })
  }

  const toggleTicketStatus = (ticketId: string) => {
    const ticket = tracker.tickets.find((entry) => entry.id === ticketId)
    if (!ticket) return

    if (
      !canManageObjectives ||
      objectivesMode !== "normalized" ||
      isLegacyOrRuntimeTrackerId(ticketId)
    ) {
      commitTracker(
        toggleLocalTicketStatusState({
          tracker,
          ticketId,
          resolveNextStatus: resolveNextTicketStatus,
        }),
      )
      return
    }

    const nextTrackerStatus = resolveNextTicketStatus(ticket.status)
    startObjectivesSync(async () => {
      const result = await setWorkspaceObjectiveStatusAction({
        objectiveId: ticketId,
        status: mapTrackerStatusToObjectiveStatus(nextTrackerStatus),
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      refreshObjectives("objectives")
    })
  }

  const editor = useWorkspaceObjectiveEditorState({
    members: seed.members,
    activeCategories,
    tracker,
    canManageObjectives,
    objectivesMode,
    commitTracker,
    refreshObjectives,
    startObjectivesSync: (action) => {
      startObjectivesSync(async () => {
        await action()
      })
    },
  })

  return {
    canManageObjectives,
    collapsedSections,
    draftCategoryTitle,
    draftTicketTitle,
    draftTicketDescription,
    draftTicketPriority,
    draftTicketDueDate,
    draftTicketAssigneeId,
    draftTicketCategoryId,
    ticketQuery,
    ticketStatusFilter,
    editingTicketId: editor.editingTicketId,
    editTitle: editor.editTitle,
    editDescription: editor.editDescription,
    editPriority: editor.editPriority,
    editDueDate: editor.editDueDate,
    editCategoryId: editor.editCategoryId,
    editAssigneeIds: editor.editAssigneeIds,
    isSyncingObjectives,
    acceleratorGroups,
    activeCategories,
    archivedCategories,
    ticketsByCategory,
    openTicketCount,
    doneTicketCount,
    setDraftCategoryTitle,
    setDraftTicketTitle,
    setDraftTicketDescription,
    setDraftTicketPriority,
    setDraftTicketDueDate,
    setDraftTicketAssigneeId,
    setDraftTicketCategoryId,
    setTicketQuery,
    setTicketStatusFilter,
    setTab,
    setEditTitle: editor.setEditTitle,
    setEditDescription: editor.setEditDescription,
    setEditPriority: editor.setEditPriority,
    setEditDueDate: editor.setEditDueDate,
    setEditCategoryId: editor.setEditCategoryId,
    toggleEditAssignee: editor.toggleEditAssignee,
    toggleSectionCollapsed,
    toggleAcceleratorGroupArchive,
    createCategory,
    toggleCategoryArchive,
    createTicket,
    toggleTicketStatus,
    openTicketEditor: editor.openTicketEditor,
    closeTicketEditor: editor.closeTicketEditor,
    saveTicketEdits: editor.saveTicketEdits,
  }
}
