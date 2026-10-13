"use client"

import type { DragEvent } from "react"
import type { Table as ReactTable } from "@tanstack/react-table"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Checkbox } from "@/components/ui/checkbox"
import type {
  OrganizationPeopleTag,
  OrganizationPeopleTagColor,
} from "@/lib/people/tags"
import { cn } from "@/lib/utils"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import {
  WorkspacePeopleDrawerSegmentsCell,
  WorkspacePeopleDrawerTagsCell,
} from "./workspace-canvas-overlay-people-table-multi-value-cells"
import {
  WorkspacePeopleDrawerActionCell,
  WorkspacePeopleDrawerCanvasCell,
  WorkspacePeopleDrawerEmailCell,
  WorkspacePeopleDrawerPersonCell,
  WorkspacePeopleDrawerReportsToCell,
  WorkspacePeopleDrawerRelationshipCell,
  WorkspacePeopleDrawerSocialMediaCell,
} from "./workspace-canvas-overlay-people-table-cells"

type WorkspacePeopleMobileListProps = {
  table: ReactTable<OrgPersonWithImage>
  placedPersonIds: ReadonlySet<string>
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  customSegment: WorkspaceCustomPeopleSegment | null
  customSegmentMemberIds: ReadonlySet<string> | null
  segments: WorkspaceCustomPeopleSegment[]
  tags: OrganizationPeopleTag[]
  draggingPersonIds: ReadonlySet<string>
  draggable: boolean
  canEdit: boolean
  showReportsTo: boolean
  label: string
  onDragStart: (personIds: string[], event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onAdd: (personId: string) => void
  onRemove: (personId: string) => void
  onAddPersonToSegment: (segmentId: string, personId: string) => void
  onCreateSegment: (label: string, personId: string) => void
  onRemovePersonFromSegment: (segmentId: string, personId: string) => void
  onAddPersonToTag: (tagId: string, personId: string) => Promise<boolean>
  onCreateTag: (input: {
    color: OrganizationPeopleTagColor
    label: string
    personId?: string
  }) => Promise<boolean>
  onDeleteTag: (tagId: string) => Promise<boolean>
  onRemovePersonFromTag: (tagId: string, personId: string) => Promise<boolean>
  onUpdateTag: (input: {
    color: OrganizationPeopleTagColor
    label: string
    tagId: string
  }) => Promise<boolean>
  onEditPerson: (person: OrgPersonWithImage) => void
  onAddPeopleToCanvas: (personIds: string[]) => number
  onRemovePersonFromCanvas: (personId: string) => void
}

export function WorkspacePeopleMobileList({
  table,
  placedPersonIds,
  peopleById,
  customSegment,
  customSegmentMemberIds,
  segments,
  tags,
  draggingPersonIds,
  draggable,
  canEdit,
  showReportsTo,
  label,
  onDragStart,
  onDragEnd,
  onAdd,
  onRemove,
  onAddPersonToSegment,
  onCreateSegment,
  onRemovePersonFromSegment,
  onAddPersonToTag,
  onCreateTag,
  onDeleteTag,
  onRemovePersonFromTag,
  onUpdateTag,
  onEditPerson,
  onAddPeopleToCanvas,
  onRemovePersonFromCanvas,
}: WorkspacePeopleMobileListProps) {
  const roleVisible = table.getColumn("role")?.getIsVisible() ?? true
  const segmentsVisible = table.getColumn("segments")?.getIsVisible() ?? true
  const tagsVisible = table.getColumn("tags")?.getIsVisible() ?? true
  const reportsToVisible =
    showReportsTo && (table.getColumn("reportsTo")?.getIsVisible() ?? false)
  const emailVisible = table.getColumn("email")?.getIsVisible() ?? true
  const linkedInVisible = table.getColumn("linkedin")?.getIsVisible() ?? true
  const canvasVisible = table.getColumn("canvas")?.getIsVisible() ?? true
  const resolveRowDragPersonIds = (person: OrgPersonWithImage) => {
    const row = table.getRow(person.id)
    if (!row?.getIsSelected()) return [person.id]

    const selectedPersonIds = table
      .getSelectedRowModel()
      .rows.map((selectedRow) => selectedRow.original.id)

    return selectedPersonIds.length > 0 ? selectedPersonIds : [person.id]
  }

  return (
    <ul
      aria-label={`${label} list`}
      className="grid min-w-0 gap-2 p-2 md:hidden"
    >
      {table.getRowModel().rows.map((row) => {
        const person = row.original
        const placed = placedPersonIds.has(person.id)
        const dragging = draggingPersonIds.has(person.id)

        return (
          <li
            key={row.id}
            draggable={draggable}
            data-state={row.getIsSelected() ? "selected" : undefined}
            data-workspace-person-placed={placed ? "true" : undefined}
            data-workspace-person-dragging={dragging ? "true" : undefined}
            onDragStart={(event) =>
              onDragStart(resolveRowDragPersonIds(person), event)
            }
            onDragEnd={onDragEnd}
            className={cn(
              "border-border/60 bg-background/80 flex min-w-0 flex-col gap-3 rounded-xl border p-3 shadow-xs",
              draggable && "cursor-grab active:cursor-grabbing",
              dragging && "opacity-60",
              placed && "bg-muted/25 text-muted-foreground"
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                aria-label={`Select ${person.name}`}
                className="mt-2 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <WorkspacePeopleDrawerPersonCell
                  person={person}
                  placed={placed}
                  onOpenPerson={onEditPerson}
                />
              </div>
            </div>

            {(roleVisible ||
              segmentsVisible ||
              tagsVisible ||
              reportsToVisible ||
              emailVisible ||
              linkedInVisible) && (
              <div className="grid min-w-0 gap-2 pl-7">
                {roleVisible ? (
                  <WorkspacePeopleDrawerRelationshipCell
                    person={person}
                    canEdit={canEdit}
                  />
                ) : null}
                {segmentsVisible ? (
                  <WorkspacePeopleDrawerSegmentsCell
                    person={person}
                    segments={segments}
                    canEdit={canEdit}
                    onAdd={onAddPersonToSegment}
                    onCreate={onCreateSegment}
                    onRemove={onRemovePersonFromSegment}
                  />
                ) : null}
                {tagsVisible ? (
                  <WorkspacePeopleDrawerTagsCell
                    person={person}
                    tags={tags}
                    canEdit={canEdit}
                    onAdd={onAddPersonToTag}
                    onCreate={onCreateTag}
                    onDelete={onDeleteTag}
                    onRemove={onRemovePersonFromTag}
                    onUpdate={onUpdateTag}
                  />
                ) : null}
                {reportsToVisible ? (
                  <div className="min-w-0 text-sm">
                    <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                      Reports To
                    </p>
                    <WorkspacePeopleDrawerReportsToCell
                      person={person}
                      peopleById={peopleById}
                    />
                  </div>
                ) : null}
                {emailVisible ? (
                  <div className="min-w-0 text-sm break-all">
                    <WorkspacePeopleDrawerEmailCell person={person} />
                  </div>
                ) : null}
                {linkedInVisible ? (
                  <div className="min-w-0 text-sm">
                    <WorkspacePeopleDrawerSocialMediaCell
                      person={person}
                      canEdit={canEdit}
                      onEditPerson={onEditPerson}
                    />
                  </div>
                ) : null}
              </div>
            )}

            <div className="border-border/60 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t pt-2 pl-7">
              <WorkspacePeopleDrawerActionCell
                person={person}
                placed={placed}
                customSegment={customSegment}
                customSegmentMemberIds={customSegmentMemberIds}
                onAddToCanvas={onAddPeopleToCanvas}
                onRemoveFromCanvas={onRemovePersonFromCanvas}
                onAddToSegment={onAdd}
                onRemoveFromSegment={onRemove}
              />
              {canvasVisible ? (
                <WorkspacePeopleDrawerCanvasCell
                  person={person}
                  placed={placed}
                />
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
