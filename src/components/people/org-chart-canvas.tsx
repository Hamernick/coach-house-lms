"use client"

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactFlow, {
  applyNodeChanges,
  Background,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  Position,
  type NodeChange,
  type NodeDragHandler,
  type ReactFlowInstance,
} from "reactflow"
import "reactflow/dist/style.css"

import Undo2Icon from "lucide-react/dist/esm/icons/undo-2"
import Redo2Icon from "lucide-react/dist/esm/icons/redo-2"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"
import type { OrgPerson } from "@/actions/people"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { PERSON_CATEGORY_META, type PersonCategory } from "@/lib/people/categories"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

type ViewPerson = OrgPerson & { displayImage?: string | null }
type Props = { people: ViewPerson[]; extras?: boolean; canEdit?: boolean }

type PersonNodeData = {
  name: string
  title?: string | null
  image?: string | null
  category?: ViewPerson["category"]
}

type FlowNode = Node<PersonNodeData>
type PositionValue = { x: number; y: number }
type PositionSnapshot = Record<string, PositionValue>
type PositionPayload = { id: string; x: number; y: number }
type GraphLayout = { defaultNodes: FlowNode[]; nodes: FlowNode[]; edges: Edge[] }

const CATEGORY_ORDER: PersonCategory[] = [
  "governing_board",
  "advisory_board",
  "staff",
  "contractors",
  "vendors",
  "volunteers",
  "supporters",
]

const CATEGORY_STRIP: Record<PersonCategory, string> = Object.fromEntries(
  Object.entries(PERSON_CATEGORY_META).map(([key, value]) => [key, value.stripClass]),
) as Record<PersonCategory, string>

const CATEGORY_RANK = new Map(CATEGORY_ORDER.map((category, index) => [category, index]))

const ORG_CHART_PADDING = 64
const NODE_WIDTH = 240
const NODE_HEIGHT = 56
const NODE_HORIZONTAL_GAP = 56
const NODE_VERTICAL_GAP = 70
const SIDE_ZONE_GAP = 120
const ZONE_VERTICAL_GAP = 88
const MAX_HISTORY = 40
const SAVE_DEBOUNCE_MS = 260
const LEADERSHIP_TITLE_PATTERN =
  /\b(founder|executive|director|president|chief|ceo|coo|cto|head|lead|chair)\b/i

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function compareByName(a: ViewPerson, b: ViewPerson) {
  return a.name.localeCompare(b.name)
}

function byCategoryThenName(a: ViewPerson, b: ViewPerson) {
  const rankA = CATEGORY_RANK.get(a.category) ?? 99
  const rankB = CATEGORY_RANK.get(b.category) ?? 99
  if (rankA !== rankB) return rankA - rankB
  return a.name.localeCompare(b.name)
}

function hasLeadershipTitle(person: ViewPerson) {
  const title = person.title?.trim() ?? ""
  return LEADERSHIP_TITLE_PATTERN.test(title)
}

function resolveLeadPerson(people: ViewPerson[]) {
  const staff = people.filter((person) => person.category === "staff")
  const staffNoManager = staff.filter((person) => !person.reportsToId || person.reportsToId === person.id)
  return (
    staffNoManager.find(hasLeadershipTitle) ??
    staff.find(hasLeadershipTitle) ??
    staffNoManager[0] ??
    staff[0] ??
    people[0]
  )
}

function getValidManagerId(person: ViewPerson, peopleById: Map<string, ViewPerson>) {
  const parentId = person.reportsToId?.trim()
  if (!parentId || parentId === person.id) return null
  if (!peopleById.has(parentId)) return null
  return parentId
}

function chunkPeople(people: ViewPerson[], size: number) {
  if (people.length <= size) return [people]
  const chunks: ViewPerson[][] = []
  for (let index = 0; index < people.length; index += size) {
    chunks.push(people.slice(index, index + size))
  }
  return chunks
}

function isFinitePosition(pos: unknown): pos is PositionValue {
  return Boolean(pos) &&
    typeof pos === "object" &&
    Number.isFinite((pos as PositionValue).x) &&
    Number.isFinite((pos as PositionValue).y)
}

function getMaxRowWidth(groups: ViewPerson[][]) {
  if (groups.length === 0) return 0
  const maxCols = Math.max(...groups.map((group) => group.length))
  if (maxCols === 0) return 0
  return maxCols * NODE_WIDTH + Math.max(0, maxCols - 1) * NODE_HORIZONTAL_GAP
}

function buildGraphLayout(people: ViewPerson[]): GraphLayout {
  if (people.length === 0) {
    return { defaultNodes: [], nodes: [], edges: [] }
  }

  const peopleById = new Map(people.map((person) => [person.id, person]))
  const lead = resolveLeadPerson(people)

  const managerByPersonId = new Map<string, string>()
  for (const person of people) {
    if (person.id === lead.id) continue
    const explicitManager = getValidManagerId(person, peopleById)
    if (explicitManager) {
      managerByPersonId.set(person.id, explicitManager)
      continue
    }
    // Keep a readable center org-chart even when staff have no manager set yet.
    if (person.category === "staff") {
      managerByPersonId.set(person.id, lead.id)
    }
  }

  const boardPeople = people
    .filter((person) => person.category === "governing_board" || person.category === "advisory_board")
    .sort(byCategoryThenName)
  const volunteerPeople = people.filter((person) => person.category === "volunteers").sort(compareByName)
  const supporterPeople = people.filter((person) => person.category === "supporters").sort(compareByName)
  let corePeople = people
    .filter(
      (person) =>
        person.category !== "governing_board" &&
        person.category !== "advisory_board" &&
        person.category !== "volunteers" &&
        person.category !== "supporters",
    )
    .sort(byCategoryThenName)

  if (corePeople.length === 0 && people.length > 0) {
    corePeople = [lead]
  }

  const coreById = new Map(corePeople.map((person) => [person.id, person]))
  const coreLead =
    corePeople.find((person) => person.id === lead.id) ??
    corePeople.find((person) => person.category === "staff") ??
    corePeople[0] ??
    null

  const rowByCoreId = new Map<string, number>()
  if (coreLead) {
    const staffDepthByPersonId = new Map<string, number>([[coreLead.id, 0]])
    const queue: string[] = [coreLead.id]

    while (queue.length > 0) {
      const parentId = queue.shift()
      if (!parentId) continue
      const parentDepth = staffDepthByPersonId.get(parentId) ?? 0

      for (const person of corePeople) {
        if (person.category !== "staff") continue
        if (managerByPersonId.get(person.id) !== parentId) continue
        if (staffDepthByPersonId.has(person.id)) continue
        staffDepthByPersonId.set(person.id, parentDepth + 1)
        queue.push(person.id)
      }
    }

    let maxStaffDepth = 0
    for (const person of corePeople) {
      if (person.category !== "staff") continue
      const depth = staffDepthByPersonId.get(person.id) ?? 1
      rowByCoreId.set(person.id, depth)
      maxStaffDepth = Math.max(maxStaffDepth, depth)
    }

    for (const person of corePeople) {
      if (rowByCoreId.has(person.id)) continue
      rowByCoreId.set(person.id, Math.max(1, maxStaffDepth))
    }
  }

  const coreRows = new Map<number, ViewPerson[]>()
  for (const person of corePeople) {
    const row = rowByCoreId.get(person.id) ?? 0
    const existing = coreRows.get(row)
    if (existing) existing.push(person)
    else coreRows.set(row, [person])
  }

  const orderedCoreRows = Array.from(coreRows.keys()).sort((a, b) => a - b)
  const coreVisualGroups: ViewPerson[][] = []
  for (const row of orderedCoreRows) {
    const rowPeople = [...(coreRows.get(row) ?? [])]
    rowPeople.sort((left, right) => {
      const leftManager = managerByPersonId.get(left.id)
      const rightManager = managerByPersonId.get(right.id)
      if (leftManager !== rightManager) return (leftManager ?? "").localeCompare(rightManager ?? "")
      return byCategoryThenName(left, right)
    })

    const wrapSize = rowPeople.every((person) => person.category === "staff") ? 4 : 3
    coreVisualGroups.push(...chunkPeople(rowPeople, wrapSize))
  }

  const volunteersPerRow =
    volunteerPeople.length > 12 ? 3 : volunteerPeople.length > 4 ? 2 : 1
  const supportersPerRow =
    supporterPeople.length > 15 ? 5 : supporterPeople.length > 6 ? 4 : 3
  const boardPerRow = boardPeople.length > 8 ? 5 : 4

  const volunteerGroups = chunkPeople(volunteerPeople, volunteersPerRow)
  const supporterGroups = chunkPeople(supporterPeople, supportersPerRow)
  const boardGroups = chunkPeople(boardPeople, boardPerRow)

  const coreWidth = getMaxRowWidth(coreVisualGroups)
  const volunteerWidth = getMaxRowWidth(volunteerGroups)
  const boardWidth = getMaxRowWidth(boardGroups)
  const supporterWidth = getMaxRowWidth(supporterGroups)

  const coreStartX = ORG_CHART_PADDING + (volunteerWidth > 0 ? volunteerWidth + SIDE_ZONE_GAP : 0)
  const coreCenterX = coreStartX + (coreWidth > 0 ? coreWidth / 2 : NODE_WIDTH / 2)

  const boardHeight =
    boardGroups.length > 0
      ? boardGroups.length * NODE_HEIGHT + Math.max(0, boardGroups.length - 1) * NODE_VERTICAL_GAP
      : 0
  const coreStartY = ORG_CHART_PADDING + (boardHeight > 0 ? boardHeight + ZONE_VERTICAL_GAP : 0)

  const nodes: FlowNode[] = []

  let visualRowIndex = 0
  for (const group of coreVisualGroups) {
    const rowWidth = group.length * NODE_WIDTH + Math.max(0, group.length - 1) * NODE_HORIZONTAL_GAP
    const startX = coreStartX + Math.max(0, Math.round((coreWidth - rowWidth) / 2))
    const y = coreStartY + visualRowIndex * (NODE_HEIGHT + NODE_VERTICAL_GAP)
    visualRowIndex += 1

    group.forEach((person, index) => {
      nodes.push({
        id: person.id,
        type: "person",
        position: { x: startX + index * (NODE_WIDTH + NODE_HORIZONTAL_GAP), y },
        data: {
          name: person.name,
          title: person.title ?? "",
          image: person.displayImage ?? person.image ?? null,
          category: person.category,
        },
      })
    })
  }

  boardGroups.forEach((group, rowIndex) => {
    const rowWidth = group.length * NODE_WIDTH + Math.max(0, group.length - 1) * NODE_HORIZONTAL_GAP
    const startX = coreCenterX - rowWidth / 2
    const y = ORG_CHART_PADDING + rowIndex * (NODE_HEIGHT + NODE_VERTICAL_GAP)

    group.forEach((person, index) => {
      nodes.push({
        id: person.id,
        type: "person",
        position: { x: startX + index * (NODE_WIDTH + NODE_HORIZONTAL_GAP), y },
        data: {
          name: person.name,
          title: person.title ?? "",
          image: person.displayImage ?? person.image ?? null,
          category: person.category,
        },
      })
    })
  })

  volunteerGroups.forEach((group, rowIndex) => {
    const rowWidth = group.length * NODE_WIDTH + Math.max(0, group.length - 1) * NODE_HORIZONTAL_GAP
    const leftZoneStart = ORG_CHART_PADDING
    const startX = leftZoneStart + Math.max(0, Math.round((volunteerWidth - rowWidth) / 2))
    const y = coreStartY + rowIndex * (NODE_HEIGHT + NODE_VERTICAL_GAP)

    group.forEach((person, index) => {
      nodes.push({
        id: person.id,
        type: "person",
        position: { x: startX + index * (NODE_WIDTH + NODE_HORIZONTAL_GAP), y },
        data: {
          name: person.name,
          title: person.title ?? "",
          image: person.displayImage ?? person.image ?? null,
          category: person.category,
        },
      })
    })
  })

  const coreBottomY =
    coreStartY +
    Math.max(0, coreVisualGroups.length - 1) * (NODE_HEIGHT + NODE_VERTICAL_GAP) +
    (coreVisualGroups.length > 0 ? NODE_HEIGHT : 0)
  const volunteerBottomY =
    coreStartY +
    Math.max(0, volunteerGroups.length - 1) * (NODE_HEIGHT + NODE_VERTICAL_GAP) +
    (volunteerGroups.length > 0 ? NODE_HEIGHT : 0)
  const supportersStartY = Math.max(coreBottomY, volunteerBottomY) + ZONE_VERTICAL_GAP

  supporterGroups.forEach((group, rowIndex) => {
    const rowWidth = group.length * NODE_WIDTH + Math.max(0, group.length - 1) * NODE_HORIZONTAL_GAP
    const startX = coreCenterX - rowWidth / 2
    const y = supportersStartY + rowIndex * (NODE_HEIGHT + NODE_VERTICAL_GAP)

    group.forEach((person, index) => {
      nodes.push({
        id: person.id,
        type: "person",
        position: { x: startX + index * (NODE_WIDTH + NODE_HORIZONTAL_GAP), y },
        data: {
          name: person.name,
          title: person.title ?? "",
          image: person.displayImage ?? person.image ?? null,
          category: person.category,
        },
      })
    })
  })

  const defaultNodes = nodes
  const withPersistedPositions = defaultNodes.map((node) => {
    const person = peopleById.get(node.id)
    if (!person || !isFinitePosition(person.pos)) return node
    return {
      ...node,
      position: { x: person.pos.x, y: person.pos.y },
    }
  })

  const nodeIds = new Set(defaultNodes.map((node) => node.id))
  const edges: Edge[] = []
  for (const [personId, managerId] of managerByPersonId.entries()) {
    if (!nodeIds.has(managerId) || !nodeIds.has(personId)) continue
    edges.push({
      id: `${managerId}-${personId}`,
      source: managerId,
      target: personId,
      type: "smoothstep",
      animated: false,
    })
  }

  return {
    defaultNodes,
    nodes: withPersistedPositions,
    edges,
  }
}

function getPositionExtent(nodes: FlowNode[]): [[number, number], [number, number]] {
  if (nodes.length === 0) {
    return [
      [-1200, -1200],
      [1200, 1200],
    ]
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + NODE_WIDTH)
    maxY = Math.max(maxY, node.position.y + NODE_HEIGHT)
  }

  return [
    [Math.floor(minX - 1200), Math.floor(minY - 900)],
    [Math.ceil(maxX + 1200), Math.ceil(maxY + 900)],
  ]
}

function snapshotFromNodes(nodes: FlowNode[]): PositionSnapshot {
  return Object.fromEntries(
    nodes.map((node) => [
      node.id,
      {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      },
    ]),
  )
}

function snapshotsEqual(left: PositionSnapshot | undefined, right: PositionSnapshot) {
  if (!left) return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  for (const key of rightKeys) {
    const leftPos = left[key]
    const rightPos = right[key]
    if (!leftPos || !rightPos) return false
    if (leftPos.x !== rightPos.x || leftPos.y !== rightPos.y) return false
  }
  return true
}

const PersonNode = memo(function PersonNode({ data }: { data: PersonNodeData }) {
  const img = data.image ?? null
  const category = (data.category ?? "staff") as PersonCategory
  const isSupporter = category === "supporters"

  return (
    <div className="relative w-[240px] rounded-lg border border-border/70 bg-card p-2">
      <div className="flex items-center gap-3 pl-2">
        <Avatar className={cn("size-10", isSupporter && "rounded-xl bg-muted/60 ring-1 ring-border/60")}>
          <AvatarImage
            className={cn(isSupporter ? "object-contain p-1.5" : "object-cover")}
            src={img ?? undefined}
            alt={data.name}
          />
          <AvatarFallback className={cn(isSupporter && "rounded-xl")}>{initials(data.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{data.name}</div>
          <div className="truncate text-xs text-muted-foreground">{data.title}</div>
        </div>
      </div>
      <span
        className={cn(
          "pointer-events-none absolute left-2 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full",
          CATEGORY_STRIP[category],
        )}
        aria-hidden="true"
      />
      <Handle type="target" position={Position.Top} className="!bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent" />
    </div>
  )
})

const ORG_NODE_TYPES = Object.freeze({ person: PersonNode })

function OrgChartCanvasComponent({ people, extras = false, canEdit = true }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [reactFlow, setReactFlow] = useState<ReactFlowInstance | null>(null)
  const [pendingFit, setPendingFit] = useState(true)
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdatesRef = useRef<Map<string, PositionPayload>>(new Map())
  const historyRef = useRef<{ stack: PositionSnapshot[]; index: number }>({
    stack: [],
    index: -1,
  })

  const theme = mounted && resolvedTheme ? resolvedTheme : "light"
  const isDark = theme === "dark"

  const graph = useMemo(() => buildGraphLayout(people), [people])
  const translateExtent = useMemo(() => getPositionExtent(nodes), [nodes])
  const showMiniMap = extras && nodes.length > 24

  const flushPositionUpdates = useCallback(async () => {
    if (pendingUpdatesRef.current.size === 0) return
    const payload = Array.from(pendingUpdatesRef.current.values())
    pendingUpdatesRef.current.clear()
    setIsSaving(true)
    try {
      const response = await fetch("/api/people/position", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ positions: payload }),
      })
      if (!response.ok) {
        throw new Error("Unable to save chart layout.")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save chart layout."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const queuePositionPersist = useCallback((updates: PositionPayload[]) => {
    if (updates.length === 0) return
    for (const update of updates) {
      pendingUpdatesRef.current.set(update.id, update)
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void flushPositionUpdates()
    }, SAVE_DEBOUNCE_MS)
  }, [flushPositionUpdates])

  const resetHistory = useCallback((snapshot: PositionSnapshot) => {
    historyRef.current = { stack: [snapshot], index: 0 }
    setHistoryVersion((value) => value + 1)
  }, [])

  const pushHistorySnapshot = useCallback((snapshot: PositionSnapshot) => {
    const current = historyRef.current
    if (snapshotsEqual(current.stack[current.index], snapshot)) return

    const nextStack = current.stack.slice(0, current.index + 1)
    nextStack.push(snapshot)
    if (nextStack.length > MAX_HISTORY) {
      nextStack.splice(0, nextStack.length - MAX_HISTORY)
    }
    historyRef.current = { stack: nextStack, index: nextStack.length - 1 }
    setHistoryVersion((value) => value + 1)
  }, [])

  const applySnapshot = useCallback(
    (snapshot: PositionSnapshot, persist: boolean) => {
      setNodes((previousNodes) => {
        const updates: PositionPayload[] = []
        const nextNodes = previousNodes.map((node) => {
          const nextPos = snapshot[node.id]
          if (!nextPos) return node
          if (node.position.x === nextPos.x && node.position.y === nextPos.y) return node
          updates.push({ id: node.id, x: nextPos.x, y: nextPos.y })
          return { ...node, position: { x: nextPos.x, y: nextPos.y } }
        })
        if (persist) queuePositionPersist(updates)
        return nextNodes
      })
    },
    [queuePositionPersist],
  )

  const canUndo = historyRef.current.index > 0
  const canRedo = historyRef.current.index > -1 && historyRef.current.index < historyRef.current.stack.length - 1

  const handleUndo = useCallback(() => {
    const current = historyRef.current
    if (current.index <= 0) return
    const nextIndex = current.index - 1
    const nextSnapshot = current.stack[nextIndex]
    historyRef.current = { stack: current.stack, index: nextIndex }
    setHistoryVersion((value) => value + 1)
    applySnapshot(nextSnapshot, true)
  }, [applySnapshot])

  const handleRedo = useCallback(() => {
    const current = historyRef.current
    if (current.index >= current.stack.length - 1) return
    const nextIndex = current.index + 1
    const nextSnapshot = current.stack[nextIndex]
    historyRef.current = { stack: current.stack, index: nextIndex }
    setHistoryVersion((value) => value + 1)
    applySnapshot(nextSnapshot, true)
  }, [applySnapshot])

  const handleResetLayout = useCallback(async () => {
    const snapshot = snapshotFromNodes(graph.defaultNodes)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    pendingUpdatesRef.current.clear()
    applySnapshot(snapshot, false)
    pushHistorySnapshot(snapshot)
    setPendingFit(true)
    try {
      await fetch("/api/people/position/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    } catch {}
  }, [applySnapshot, graph.defaultNodes, pushHistorySnapshot])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((previousNodes) => applyNodeChanges(changes, previousNodes) as FlowNode[])
  }, [])

  const onNodeDragStop = useCallback<NodeDragHandler>(
    (_, node) => {
      if (!canEdit) return
      setNodes((previousNodes) => {
        const nextNodes = previousNodes.map((item) => {
          if (item.id !== node.id) return item
          return {
            ...item,
            position: {
              x: Math.round(node.position.x),
              y: Math.round(node.position.y),
            },
          }
        })
        const snapshot = snapshotFromNodes(nextNodes)
        pushHistorySnapshot(snapshot)
        queuePositionPersist([
          {
            id: node.id,
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          },
        ])
        return nextNodes
      })
    },
    [canEdit, pushHistorySnapshot, queuePositionPersist],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setNodes(graph.nodes)
    resetHistory(snapshotFromNodes(graph.nodes))
    setPendingFit(true)
  }, [graph.nodes, resetHistory])

  useEffect(() => {
    if (!reactFlow || !pendingFit) return
    const frame = window.requestAnimationFrame(() => {
      reactFlow.fitView({
        padding: 0.3,
        minZoom: 0.14,
        maxZoom: 0.9,
        duration: 160,
      })
      setPendingFit(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pendingFit, reactFlow, historyVersion])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      void flushPositionUpdates()
    }
  }, [flushPositionUpdates])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {canEdit ? "Drag to reorganize your chart." : "Organization chart"}
        </p>
        {canEdit ? (
          <div className="inline-flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={!canUndo}>
              <Undo2Icon className="mr-1 size-4" />
              Undo
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={!canRedo}>
              <Redo2Icon className="mr-1 size-4" />
              Redo
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetLayout}>
              <RotateCcwIcon className="mr-1 size-4" />
              Reset layout
            </Button>
            {isSaving ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
          </div>
        ) : null}
      </div>
      <div
        className="h-[min(64vh,720px)] w-full rounded-2xl border border-border/60 bg-card/60 shadow-sm"
        style={{ contain: "layout paint" }}
      >
        {!mounted ? (
          <div className="h-full w-full" />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={graph.edges}
            defaultViewport={{ x: 0, y: 0, zoom: 0.38 }}
            minZoom={0.12}
            maxZoom={1}
            zoomOnPinch
            zoomOnScroll
            panOnDrag
            panOnScroll={false}
            nodesDraggable={canEdit}
            nodesConnectable={false}
            elementsSelectable={canEdit}
            selectionOnDrag={false}
            selectNodesOnDrag={false}
            onlyRenderVisibleElements
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: "smoothstep",
              style: { strokeWidth: 1.4 },
            }}
            nodeTypes={ORG_NODE_TYPES}
            translateExtent={translateExtent}
            className="org-flow"
            style={{ width: "100%", height: "100%" }}
            onInit={setReactFlow}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
          >
            <Controls position="top-right" showInteractive={false} />
            {showMiniMap ? <MiniMap pannable zoomable /> : null}
            <Background color={isDark ? "#1f2937" : "#e5e7eb"} gap={18} />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}

export const OrgChartCanvas = memo(OrgChartCanvasComponent)
