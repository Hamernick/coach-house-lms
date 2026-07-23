"use client"

import { memo, useEffect, useRef, type CSSProperties } from "react"
import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import CircleAlertIcon from "lucide-react/dist/esm/icons/circle-alert"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import GraduationCapIcon from "lucide-react/dist/esm/icons/graduation-cap"
import LandmarkIcon from "lucide-react/dist/esm/icons/landmark"
import ListChecksIcon from "lucide-react/dist/esm/icons/list-checks"
import NetworkIcon from "lucide-react/dist/esm/icons/network"
import UsersIcon from "lucide-react/dist/esm/icons/users"
import { Handle, Position, type NodeProps } from "reactflow"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { Button } from "@/components/ui/button"
import {
  WorkspaceNodeFrameBody,
  WorkspaceNodeFrameHeader,
  WorkspaceNodeFrameRoot,
  WorkspaceNodeFrameSurface,
} from "@/components/workspace/workspace-node-frame"
import { cn } from "@/lib/utils"

import { describeWorkspaceOntologyNodeActivation } from "../lib"
import type {
  WorkspaceOntologyDetailLevel,
  WorkspaceOntologyProjectedNode,
} from "../types"

export type WorkspaceOntologyNodeData = {
  kind: "workspace-ontology"
  node: WorkspaceOntologyProjectedNode
  detailLevel: WorkspaceOntologyDetailLevel
  expanded: boolean
  transitionPhase?: "entering" | "stable" | "exiting"
  transitionDelayMs?: number
  onActivate?: () => void
}

export const WORKSPACE_ONTOLOGY_RELATIONSHIP_TARGET_HANDLE_ID =
  "workspace-ontology-relationship-target"
export const WORKSPACE_ONTOLOGY_RELATIONSHIP_SOURCE_HANDLE_ID =
  "workspace-ontology-relationship-source"

const CATEGORY_ICON = {
  organization: LandmarkIcon,
  programs: NetworkIcon,
  people: UsersIcon,
  accelerator: GraduationCapIcon,
  roadmap: ListChecksIcon,
  documents: FileTextIcon,
  activity: CircleDashedIcon,
  tasks: ListChecksIcon,
  calendar: CalendarDaysIcon,
  fiscal: LandmarkIcon,
} as const

const STATUS_META = {
  missing: {
    icon: CircleIcon,
    className: "text-red-700 dark:text-red-300",
  },
  blocked: {
    icon: CircleAlertIcon,
    className: "text-amber-700 dark:text-amber-300",
  },
  "in-progress": {
    icon: CircleDashedIcon,
    className: "text-blue-700 dark:text-blue-300",
  },
  complete: {
    icon: CheckCircle2Icon,
    className: "text-emerald-700 dark:text-emerald-300",
  },
} as const

const WORKSPACE_ONTOLOGY_NODE_SOURCE =
  "src/features/workspace-ontology/components/workspace-ontology-node.tsx"

const WORKSPACE_ONTOLOGY_NODE_REACT_GRAB_PROPS = getReactGrabOwnerProps({
  ownerId: "workspace-ontology:node",
  component: "WorkspaceOntologyNode",
  source: WORKSPACE_ONTOLOGY_NODE_SOURCE,
  slot: "node",
  canonicalOwnerSource: WORKSPACE_ONTOLOGY_NODE_SOURCE,
  canonicalOwnerReason:
    "The ontology feature owns generated node content, containment, and semantic density.",
  primitiveImport: "src/components/workspace/workspace-node-frame.tsx",
})

export const WorkspaceOntologyNode = memo(function WorkspaceOntologyNode({
  data,
  selected,
}: NodeProps<WorkspaceOntologyNodeData>) {
  const {
    node,
    detailLevel,
    expanded,
    transitionPhase = "stable",
    transitionDelayMs = 0,
  } = data
  const CategoryIcon = CATEGORY_ICON[node.category]
  const statusMeta = STATUS_META[node.status]
  const StatusIcon = statusMeta.icon
  const hasExactDestination = Boolean(node.href || node.actionTarget)
  const hasNavigationDestination = !node.hasChildren && Boolean(node.href)
  const externalDestination =
    hasNavigationDestination && /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(node.href!)
  const actionLabel = describeWorkspaceOntologyNodeActivation({
    node,
    expanded,
  })
  const nodeContentRef = useRef<HTMLDivElement>(null)

  const actionClassName =
    "group/action nodrag nopan h-full min-h-11 w-full touch-manipulation justify-between rounded-[1.45rem] border-border/60 bg-background px-3 text-left text-xs shadow-xs transition-[background-color,border-color,box-shadow,transform] duration-150 hover:bg-accent dark:bg-background dark:hover:bg-accent active:scale-[0.985] motion-reduce:transform-none motion-reduce:transition-none sm:min-h-9"
  const actionAriaLabel = `${node.label}. ${node.statusLabel}. ${actionLabel}.`
  const actionContent = (
    <>
      <span className="flex max-w-[52%] min-w-0 items-center gap-1.5">
        <StatusIcon
          className={cn("size-3.5 shrink-0", statusMeta.className)}
          aria-hidden="true"
        />
        <span
          className={cn("min-w-0 truncate font-medium", statusMeta.className)}
          title={node.statusLabel}
        >
          {node.statusLabel}
        </span>
        {detailLevel === "full" && node.ownerLabel ? (
          <>
            <span
              className="bg-border size-1 shrink-0 rounded-full"
              aria-hidden="true"
            />
            <span
              className="text-muted-foreground min-w-0 truncate"
              title={node.ownerLabel}
            >
              {node.ownerLabel}
            </span>
          </>
        ) : null}
      </span>
      <span className="text-foreground ml-auto flex max-w-[48%] min-w-0 items-center justify-end gap-1.5">
        <span className="min-w-0 truncate text-right">{actionLabel}</span>
        {node.hasChildren ? (
          <ChevronRightIcon
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none",
              expanded && "rotate-90"
            )}
            aria-hidden="true"
          />
        ) : (
          <ArrowUpRightIcon
            className="size-3.5 shrink-0 opacity-70 transition-[opacity,transform] duration-150 group-hover/action:translate-x-0.5 group-hover/action:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
            aria-hidden="true"
          />
        )}
      </span>
    </>
  )
  const actionSurface = hasNavigationDestination ? (
    externalDestination ? (
      <Button asChild variant="outline" size="sm" className={actionClassName}>
        <a
          href={node.href!}
          aria-label={actionAriaLabel}
          onClick={(event) => event.stopPropagation()}
        >
          {actionContent}
        </a>
      </Button>
    ) : (
      <Button asChild variant="outline" size="sm" className={actionClassName}>
        <Link
          href={node.href!}
          aria-label={actionAriaLabel}
          onClick={(event) => event.stopPropagation()}
        >
          {actionContent}
        </Link>
      </Button>
    )
  ) : (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={actionClassName}
      aria-label={actionAriaLabel}
      aria-expanded={node.hasChildren ? expanded : undefined}
      onClick={(event) => {
        event.stopPropagation()
        data.onActivate?.()
      }}
    >
      {actionContent}
    </Button>
  )

  const content = (
    <WorkspaceNodeFrameSurface className="flex h-full flex-col gap-2 overflow-visible">
      <WorkspaceNodeFrameHeader className="min-h-8 items-center gap-2 px-2">
        <span className="border-border/60 bg-background text-muted-foreground relative grid size-8 shrink-0 place-items-center rounded-xl border shadow-xs">
          <CategoryIcon className="size-4" aria-hidden="true" />
        </span>
        <p
          className="text-foreground line-clamp-2 min-w-0 flex-1 text-sm leading-4 font-semibold"
          title={node.label}
        >
          {node.label}
        </p>
      </WorkspaceNodeFrameHeader>
      <WorkspaceNodeFrameBody className="min-h-0 flex-1 overflow-visible">
        {actionSurface}
      </WorkspaceNodeFrameBody>
    </WorkspaceNodeFrameSurface>
  )

  useEffect(() => {
    const nodeElement =
      nodeContentRef.current?.closest<HTMLElement>(".react-flow__node")
    if (!nodeElement) return
    if (node.hasChildren) {
      nodeElement.setAttribute("aria-expanded", String(expanded))
    } else {
      nodeElement.removeAttribute("aria-expanded")
    }
    return () => nodeElement.removeAttribute("aria-expanded")
  }, [expanded, node.hasChildren])

  return (
    <div
      ref={nodeContentRef}
      className={cn(
        "workspace-ontology-node-presence group/ontology h-full w-full",
        transitionPhase === "exiting" && "pointer-events-none"
      )}
      data-transition-phase={transitionPhase}
      data-transition-delay-ms={transitionDelayMs}
      style={
        {
          "--workspace-ontology-wave-delay": `${transitionDelayMs}ms`,
        } as CSSProperties
      }
    >
      <WorkspaceNodeFrameRoot
        {...WORKSPACE_ONTOLOGY_NODE_REACT_GRAB_PROPS}
        data-workspace-ontology-node={node.id}
        data-workspace-ontology-primary-action={
          node.hasChildren
            ? expanded
              ? "hide-details"
              : "show-details"
            : hasExactDestination
              ? "open"
              : "focus-root"
        }
        aria-hidden={transitionPhase === "exiting" ? true : undefined}
        aria-expanded={node.hasChildren ? expanded : undefined}
        className={cn(
          "border-border/60 bg-muted h-full w-full overflow-visible rounded-[2rem] px-2 py-2.5 shadow-sm focus-within:ring-2",
          "transition-[border-color,background-color,box-shadow] duration-150",
          "hover:border-foreground/25 hover:bg-muted",
          selected && "border-foreground/25 shadow-sm"
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="pointer-events-none opacity-0"
          isConnectable={false}
        />
        {content}
        <Handle
          id={WORKSPACE_ONTOLOGY_RELATIONSHIP_TARGET_HANDLE_ID}
          type="target"
          position={Position.Bottom}
          style={{ left: "42%" }}
          className="pointer-events-none opacity-0"
          isConnectable={false}
        />
        <Handle
          id={WORKSPACE_ONTOLOGY_RELATIONSHIP_SOURCE_HANDLE_ID}
          type="source"
          position={Position.Bottom}
          style={{ left: "58%" }}
          className="pointer-events-none opacity-0"
          isConnectable={false}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="pointer-events-none opacity-0"
          isConnectable={false}
        />
      </WorkspaceNodeFrameRoot>
    </div>
  )
})

WorkspaceOntologyNode.displayName = "WorkspaceOntologyNode"
