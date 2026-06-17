"use client"

import { memo, type DragEvent } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import {
  Editable,
  EditableArea,
  EditableCancel,
  EditableInput,
  EditableSubmit,
  EditableToolbar,
} from "@/components/ui/editable"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import type { WorkspacePeopleSegment } from "./workspace-canvas-people-segment-types"

type WorkspacePeopleSegmentRailProps = {
  segments: WorkspacePeopleSegment[]
  selectedSegmentId: string
  editingSegmentId: string | null
  draggingPersonId: string | null
  canManageSegments: boolean
  onSegmentChange: (segmentId: string) => void
  onCreateSegment: () => void
  onRenameSegment: (segmentId: string, label: string) => void
  onCancelEditSegment: () => void
  onSegmentDragOver: (
    segment: WorkspacePeopleSegment,
    event: DragEvent<HTMLElement>
  ) => void
  onPersonDrop: (segmentId: string, event: DragEvent<HTMLElement>) => void
}

const WorkspacePeopleCustomSegmentEditor = memo(
  function WorkspacePeopleCustomSegmentEditor({
    segment,
    onRenameSegment,
    onCancelEditSegment,
  }: {
    segment: Extract<WorkspacePeopleSegment, { kind: "custom" }>
    onRenameSegment: (segmentId: string, label: string) => void
    onCancelEditSegment: () => void
  }) {
    return (
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-right-1 bg-background inline-flex h-8 shrink-0 items-center gap-1 rounded-full pr-1 pl-2 shadow-sm motion-safe:duration-150">
        <Editable
          key={segment.id}
          defaultValue={segment.label}
          defaultEditing
          autosize
          maxLength={32}
          placeholder="Segment name"
          onSubmit={(value) => onRenameSegment(segment.id, value)}
          onCancel={onCancelEditSegment}
          className="min-w-0 flex-row items-center gap-1"
        >
          <EditableArea className="min-w-0">
            <EditableInput
              aria-label={`Rename ${segment.label}`}
              className="border-border/70 h-6 max-w-40 min-w-24 rounded-full px-2 py-0 text-xs"
            />
          </EditableArea>
          <EditableToolbar className="gap-0.5">
            <EditableSubmit asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="nodrag nopan text-muted-foreground hover:text-foreground size-6 rounded-full"
                aria-label={`Save ${segment.label}`}
                title="Save segment name"
              >
                <CheckIcon aria-hidden />
              </Button>
            </EditableSubmit>
            <EditableCancel asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="nodrag nopan text-muted-foreground hover:text-foreground size-6 rounded-full"
                aria-label={`Cancel editing ${segment.label}`}
                title="Cancel rename"
              >
                <XIcon aria-hidden />
              </Button>
            </EditableCancel>
          </EditableToolbar>
        </Editable>
        <span className="text-muted-foreground pr-1 text-[10px]">
          {segment.count}
        </span>
      </div>
    )
  }
)

const WorkspacePeopleSegmentTab = memo(function WorkspacePeopleSegmentTab({
  segment,
  draggingPersonId,
  onSegmentDragOver,
  onPersonDrop,
}: {
  segment: WorkspacePeopleSegment
  draggingPersonId: string | null
  onSegmentDragOver: (
    segment: WorkspacePeopleSegment,
    event: DragEvent<HTMLElement>
  ) => void
  onPersonDrop: (segmentId: string, event: DragEvent<HTMLElement>) => void
}) {
  const custom = segment.kind === "custom"

  return (
    <div
      data-workspace-people-segment-tab={segment.kind}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full",
        custom &&
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-right-1 motion-safe:duration-150",
        draggingPersonId && custom && "ring-ring/50 ring-1"
      )}
      onDragOver={(event) => onSegmentDragOver(segment, event)}
      onDrop={(event) => {
        if (custom) onPersonDrop(segment.id, event)
      }}
    >
      <ToggleGroupItem
        value={segment.id}
        size="sm"
        className="data-[state=on]:bg-background h-8 rounded-full border-0 px-3 text-xs data-[state=on]:shadow-sm"
      >
        <span className="max-w-32 truncate">{segment.label}</span>
        <span className="text-muted-foreground ml-1 text-[10px]">
          {segment.count}
        </span>
      </ToggleGroupItem>
    </div>
  )
})

export const WorkspacePeopleSegmentRail = memo(
  function WorkspacePeopleSegmentRail({
    segments,
    selectedSegmentId,
    editingSegmentId,
    draggingPersonId,
    canManageSegments,
    onSegmentChange,
    onCreateSegment,
    onRenameSegment,
    onCancelEditSegment,
    onSegmentDragOver,
    onPersonDrop,
  }: WorkspacePeopleSegmentRailProps) {
    return (
      <div className="min-w-0 flex-1 overflow-x-auto px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToggleGroup
          type="single"
          spacing={1}
          value={selectedSegmentId}
          onValueChange={(value) => {
            if (value) onSegmentChange(value)
          }}
          className="bg-muted/70 w-max rounded-full p-1"
        >
          {segments.map((segment) =>
            segment.kind === "custom" && editingSegmentId === segment.id ? (
              <WorkspacePeopleCustomSegmentEditor
                key={segment.id}
                segment={segment}
                onRenameSegment={onRenameSegment}
                onCancelEditSegment={onCancelEditSegment}
              />
            ) : (
              <WorkspacePeopleSegmentTab
                key={segment.id}
                segment={segment}
                draggingPersonId={draggingPersonId}
                onSegmentDragOver={onSegmentDragOver}
                onPersonDrop={onPersonDrop}
              />
            )
          )}
          {canManageSegments ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="nodrag nopan text-muted-foreground hover:bg-background hover:text-foreground size-8 shrink-0 rounded-full"
              onClick={onCreateSegment}
              aria-label="Create people segment"
              title="Create segment"
              data-workspace-people-segment-add="true"
            >
              <PlusIcon aria-hidden />
            </Button>
          ) : null}
        </ToggleGroup>
      </div>
    )
  }
)
