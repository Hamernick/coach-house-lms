"use client"

import type { DragEvent } from "react"
import type { Table as ReactTable } from "@tanstack/react-table"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import {
  WorkspacePeopleDrawerCanvasCell,
  WorkspacePeopleDrawerEmailCell,
  WorkspacePeopleDrawerLinkedInCell,
  WorkspacePeopleDrawerPersonCell,
  WorkspacePeopleDrawerReportsToCell,
  WorkspacePeopleDrawerRelationshipCell,
  WorkspacePeopleDrawerSegmentActionCell,
} from "./workspace-canvas-overlay-people-table-cells"

type WorkspacePeopleMobileListProps = {
  table: ReactTable<OrgPersonWithImage>
  placedPersonIds: ReadonlySet<string>
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  customSegment: WorkspaceCustomPeopleSegment | null
  customSegmentMemberIds: ReadonlySet<string> | null
  draggable: boolean
  label: string
  onDragStart: (personIds: string[], event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onAdd: (personId: string) => void
  onRemove: (personId: string) => void
}

export function WorkspacePeopleMobileList({
  table,
  placedPersonIds,
  peopleById,
  customSegment,
  customSegmentMemberIds,
  draggable,
  label,
  onDragStart,
  onDragEnd,
  onAdd,
  onRemove,
}: WorkspacePeopleMobileListProps) {
  const relationshipVisible =
    table.getColumn("relationship")?.getIsVisible() ?? true
  const reportsToVisible = table.getColumn("reportsTo")?.getIsVisible() ?? true
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

        return (
          <li
            key={row.id}
            draggable={draggable}
            data-state={row.getIsSelected() ? "selected" : undefined}
            data-workspace-person-placed={placed ? "true" : undefined}
            onDragStart={(event) =>
              onDragStart(resolveRowDragPersonIds(person), event)
            }
            onDragEnd={onDragEnd}
            className={cn(
              "border-border/60 bg-background/80 flex min-w-0 flex-col gap-3 rounded-xl border p-3 shadow-xs",
              draggable && "cursor-grab active:cursor-grabbing",
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
                />
              </div>
            </div>

            {(relationshipVisible ||
              reportsToVisible ||
              emailVisible ||
              linkedInVisible) && (
              <div className="grid min-w-0 gap-2 pl-7">
                {relationshipVisible ? (
                  <WorkspacePeopleDrawerRelationshipCell person={person} />
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
                    <WorkspacePeopleDrawerLinkedInCell person={person} />
                  </div>
                ) : null}
              </div>
            )}

            {Boolean(customSegment || canvasVisible) && (
              <div className="border-border/60 flex min-w-0 flex-wrap items-center justify-start gap-2 border-t pt-2 pl-7">
                {customSegment ? (
                  <WorkspacePeopleDrawerSegmentActionCell
                    person={person}
                    customSegment={customSegment}
                    customSegmentMemberIds={customSegmentMemberIds}
                    onAdd={onAdd}
                    onRemove={onRemove}
                  />
                ) : (
                  <span aria-hidden />
                )}
                {canvasVisible ? (
                  <WorkspacePeopleDrawerCanvasCell
                    person={person}
                    placed={placed}
                  />
                ) : null}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
