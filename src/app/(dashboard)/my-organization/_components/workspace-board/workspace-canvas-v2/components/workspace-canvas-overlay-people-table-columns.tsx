"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Checkbox } from "@/components/ui/checkbox"

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

export const WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS: Record<string, string> = {
  person: "Person",
  relationship: "Relationship",
  reportsTo: "Reports To",
  email: "Email",
  linkedin: "LinkedIn",
  action: "Action",
  canvas: "Canvas",
}

type BuildWorkspacePeopleDrawerColumnsArgs = {
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  customSegment: WorkspaceCustomPeopleSegment | null
  customSegmentMemberIds: ReadonlySet<string> | null
  onAdd: (personId: string) => void
  onRemove: (personId: string) => void
  placedPersonIds: ReadonlySet<string>
}

export function buildWorkspacePeopleDrawerColumns({
  peopleById,
  customSegment,
  customSegmentMemberIds,
  onAdd,
  onRemove,
  placedPersonIds,
}: BuildWorkspacePeopleDrawerColumnsArgs): ColumnDef<OrgPersonWithImage>[] {
  const columns: ColumnDef<OrgPersonWithImage>[] = [
    {
      id: "select",
      enableHiding: false,
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
            aria-label="Select all people"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label={`Select ${row.original.name}`}
          />
        </div>
      ),
    },
    {
      id: "person",
      enableHiding: false,
      header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.person,
      cell: ({ row }) => (
        <WorkspacePeopleDrawerPersonCell
          person={row.original}
          placed={placedPersonIds.has(row.original.id)}
        />
      ),
    },
    {
      id: "relationship",
      header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.relationship,
      cell: ({ row }) => (
        <WorkspacePeopleDrawerRelationshipCell person={row.original} />
      ),
    },
    {
      id: "reportsTo",
      header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.reportsTo,
      cell: ({ row }) => (
        <WorkspacePeopleDrawerReportsToCell
          person={row.original}
          peopleById={peopleById}
        />
      ),
    },
    {
      id: "email",
      header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.email,
      cell: ({ row }) => (
        <WorkspacePeopleDrawerEmailCell person={row.original} />
      ),
    },
    {
      id: "linkedin",
      header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.linkedin,
      cell: ({ row }) => (
        <WorkspacePeopleDrawerLinkedInCell person={row.original} />
      ),
    },
  ]

  if (customSegment) {
    columns.push({
      id: "action",
      enableHiding: false,
      header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.action,
      cell: ({ row }) => (
        <WorkspacePeopleDrawerSegmentActionCell
          person={row.original}
          customSegment={customSegment}
          customSegmentMemberIds={customSegmentMemberIds}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ),
    })
  }

  columns.push({
    id: "canvas",
    header: () => <span className="sr-only">Canvas status and drag</span>,
    cell: ({ row }) => (
      <WorkspacePeopleDrawerCanvasCell
        person={row.original}
        placed={placedPersonIds.has(row.original.id)}
      />
    ),
  })

  return columns
}
