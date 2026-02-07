"use client"

import React, { memo, useEffect, useMemo, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  Position,
  type ReactFlowInstance,
} from "reactflow"
import "reactflow/dist/style.css"

import type { OrgPerson } from "@/actions/people"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { PERSON_CATEGORY_META, type PersonCategory } from "@/lib/people/categories"
import { cn } from "@/lib/utils"

type ViewPerson = OrgPerson & { displayImage?: string | null }
type Props = { people: ViewPerson[]; extras?: boolean; canEdit?: boolean }

type PersonNodeData = {
  name: string
  title?: string | null
  image?: string | null
  category?: ViewPerson["category"]
}

type FlowNode = Node<PersonNodeData>

const CATEGORY_ORDER: PersonCategory[] = [
  "governing_board",
  "advisory_board",
  "contractors",
  "staff",
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
const NODE_VERTICAL_GAP = 72
const LEADERSHIP_TITLE_PATTERN =
  /\b(founder|executive|director|president|chief|ceo|coo|cto|head|lead|chair)\b/i

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function byCategoryThenName(a: ViewPerson, b: ViewPerson) {
  const rankA = CATEGORY_RANK.get(a.category) ?? 99
  const rankB = CATEGORY_RANK.get(b.category) ?? 99
  if (rankA !== rankB) return rankA - rankB
  return a.name.localeCompare(b.name)
}

function compareByName(a: ViewPerson, b: ViewPerson) {
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

function chunkPeople(people: ViewPerson[], size: number) {
  if (people.length <= size) return [people]
  const chunks: ViewPerson[][] = []
  for (let index = 0; index < people.length; index += size) {
    chunks.push(people.slice(index, index + size))
  }
  return chunks
}

function buildGraphLayout(people: ViewPerson[]): { nodes: FlowNode[]; edges: Edge[] } {
  if (people.length === 0) {
    return { nodes: [], edges: [] }
  }

  const peopleById = new Map(people.map((person) => [person.id, person]))
  const lead = resolveLeadPerson(people)
  const managerByPersonId = new Map<string, string>()
  const childrenByParent = new Map<string, ViewPerson[]>()

  for (const person of people) {
    if (person.id === lead.id) continue

    const explicitManager = getValidManagerId(person, peopleById)
    const managerId =
      explicitManager ??
      (person.category === "staff" || person.category === "volunteers" || person.category === "contractors"
        ? lead.id
        : null)

    if (!managerId || managerId === person.id) continue
    managerByPersonId.set(person.id, managerId)
    const existingChildren = childrenByParent.get(managerId)
    if (existingChildren) existingChildren.push(person)
    else childrenByParent.set(managerId, [person])
  }

  for (const children of childrenByParent.values()) {
    children.sort(compareByName)
  }

  const rowByPersonId = new Map<string, number>()
  const staffDepthByPersonId = new Map<string, number>()
  staffDepthByPersonId.set(lead.id, 0)

  const queue: string[] = [lead.id]
  while (queue.length > 0) {
    const parentId = queue.shift()
    if (!parentId) continue
    const parentDepth = staffDepthByPersonId.get(parentId) ?? 0
    const children = childrenByParent.get(parentId) ?? []
    for (const child of children) {
      if (child.category !== "staff") continue
      if (staffDepthByPersonId.has(child.id)) continue
      staffDepthByPersonId.set(child.id, parentDepth + 1)
      queue.push(child.id)
    }
  }

  rowByPersonId.set(lead.id, 1)
  let maxStaffRow = 1

  for (const person of people) {
    if (person.id === lead.id) continue
    if (person.category !== "staff") continue
    const depth = staffDepthByPersonId.get(person.id) ?? 1
    const row = 1 + depth
    rowByPersonId.set(person.id, row)
    if (row > maxStaffRow) maxStaffRow = row
  }

  const volunteersRow = maxStaffRow + 1
  const supportersRow = volunteersRow + 1

  for (const person of people) {
    if (rowByPersonId.has(person.id)) continue

    if (person.category === "governing_board" || person.category === "advisory_board") {
      rowByPersonId.set(person.id, 0)
      continue
    }

    if (person.category === "volunteers") {
      rowByPersonId.set(person.id, volunteersRow)
      continue
    }

    if (person.category === "supporters") {
      rowByPersonId.set(person.id, supportersRow)
      continue
    }

    if (person.category === "contractors" || person.category === "vendors") {
      rowByPersonId.set(person.id, 2)
      continue
    }

    rowByPersonId.set(person.id, maxStaffRow)
  }

  const rows = new Map<number, ViewPerson[]>()
  for (const person of people) {
    const row = rowByPersonId.get(person.id) ?? 1
    const existing = rows.get(row)
    if (existing) existing.push(person)
    else rows.set(row, [person])
  }

  const orderedRows = Array.from(rows.keys()).sort((a, b) => a - b)
  const orderByPersonId = new Map<string, number>()
  let orderCursor = 0

  for (const row of orderedRows) {
    const rowPeople = rows.get(row) ?? []
    rowPeople.sort((left, right) => {
      if (row === 2) {
        const laneRank = (person: ViewPerson) => {
          if (person.category === "contractors") return 0
          if (person.category === "staff") return 1
          if (person.category === "vendors") return 2
          return 3
        }
        const laneDelta = laneRank(left) - laneRank(right)
        if (laneDelta !== 0) return laneDelta
      }
      const parentOrderLeft = managerByPersonId.has(left.id)
        ? (orderByPersonId.get(managerByPersonId.get(left.id) as string) ?? Number.MAX_SAFE_INTEGER)
        : -1
      const parentOrderRight = managerByPersonId.has(right.id)
        ? (orderByPersonId.get(managerByPersonId.get(right.id) as string) ?? Number.MAX_SAFE_INTEGER)
        : -1
      if (parentOrderLeft !== parentOrderRight) return parentOrderLeft - parentOrderRight
      return byCategoryThenName(left, right)
    })

    for (const person of rowPeople) {
      orderByPersonId.set(person.id, orderCursor)
      orderCursor += 1
    }
  }

  const maxPerRow = Math.max(1, ...orderedRows.map((row) => rows.get(row)?.length ?? 0))
  const visualRows: ViewPerson[][] = []
  const rowGroups: ViewPerson[][][] = []

  for (const row of orderedRows) {
    const rowPeople = rows.get(row) ?? []
    const supportersOnly = rowPeople.every((person) => person.category === "supporters")
    const boardOnly = rowPeople.every(
      (person) => person.category === "governing_board" || person.category === "advisory_board",
    )
    const wrapSize = supportersOnly ? 5 : boardOnly ? 4 : 6
    const chunks = chunkPeople(rowPeople, wrapSize)
    rowGroups.push(chunks)
    visualRows.push(...chunks)
  }

  const maxPerVisualRow = Math.max(
    1,
    ...visualRows.map((group) => group.length),
    maxPerRow,
  )
  const gridInnerWidth =
    maxPerVisualRow * NODE_WIDTH + Math.max(0, maxPerVisualRow - 1) * NODE_HORIZONTAL_GAP
  const nodes: FlowNode[] = []
  let baseRowCursor = 0

  for (const chunks of rowGroups) {
    const baseStartY = ORG_CHART_PADDING + baseRowCursor * (NODE_HEIGHT + NODE_VERTICAL_GAP)
    chunks.forEach((chunk, chunkIndex) => {
      const rowWidth = chunk.length * NODE_WIDTH + Math.max(0, chunk.length - 1) * NODE_HORIZONTAL_GAP
      const startX = ORG_CHART_PADDING + Math.max(0, Math.round((gridInnerWidth - rowWidth) / 2))
      const y = baseStartY + chunkIndex * (NODE_HEIGHT + 28)

      chunk.forEach((person, index) => {
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
    baseRowCursor += Math.max(1, chunks.length)
  }

  const nodeIds = new Set(nodes.map((node) => node.id))
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

  const boardMembers = people.filter(
    (person) => person.category === "governing_board" || person.category === "advisory_board",
  )
  for (const member of boardMembers) {
    if (member.id === lead.id) continue
    if (managerByPersonId.has(member.id)) continue
    if (!nodeIds.has(member.id) || !nodeIds.has(lead.id)) continue
    edges.push({
      id: `${member.id}-${lead.id}`,
      source: member.id,
      target: lead.id,
      type: "smoothstep",
      animated: false,
    })
  }

  return { nodes, edges }
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

function OrgChartCanvasComponent({ people, extras = false }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [reactFlow, setReactFlow] = useState<ReactFlowInstance | null>(null)
  const [pendingFit, setPendingFit] = useState(true)

  const theme = mounted && resolvedTheme ? resolvedTheme : "light"
  const isDark = theme === "dark"

  const graph = useMemo(() => buildGraphLayout(people), [people])
  const translateExtent = useMemo(() => getPositionExtent(graph.nodes), [graph.nodes])
  const showMiniMap = extras && graph.nodes.length > 24

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setPendingFit(true)
  }, [graph.nodes.length])

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
  }, [pendingFit, reactFlow])

  return (
    <div className="space-y-3">
      <div className="h-[min(64vh,720px)] w-full rounded-2xl border border-border/60 bg-card/60 shadow-sm" style={{ contain: "layout paint" }}>
        {!mounted ? (
          <div className="h-full w-full" />
        ) : (
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            defaultViewport={{ x: 0, y: 0, zoom: 0.38 }}
            minZoom={0.12}
            maxZoom={1}
            zoomOnPinch
            zoomOnScroll
            panOnDrag
            panOnScroll={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
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
