"use client"

import { memo } from "react"

import type { OrgPerson } from "@/actions/people"
import { CreatePersonDialog } from "@/components/people/create-person-dialog"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PERSON_CATEGORY_OPTIONS,
  type PersonCategory,
} from "@/lib/people/categories"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import { WorkspacePeopleSegmentPersonPicker } from "./workspace-canvas-people-segment-person-picker"

type WorkspacePeopleDrawerControlsProps = {
  people: OrgPerson[]
  canEdit: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  categoryFilter: PersonCategory | "all"
  onCategoryFilterChange: (value: PersonCategory | "all") => void
  customSegment: WorkspaceCustomPeopleSegment | null
  availablePeople: OrgPersonWithImage[]
  onAddPeopleToSegment: (personIds: string[]) => void
}

export const WorkspacePeopleDrawerControls = memo(
  function WorkspacePeopleDrawerControls({
    people,
    canEdit,
    searchValue,
    onSearchChange,
    categoryFilter,
    onCategoryFilterChange,
    customSegment,
    availablePeople,
    onAddPeopleToSegment,
  }: WorkspacePeopleDrawerControlsProps) {
    return (
      <div className="grid w-full max-w-full min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_auto] md:items-center">
        <div className="min-w-0">
          {customSegment && canEdit ? (
            <WorkspacePeopleSegmentPersonPicker
              segmentLabel={customSegment.label}
              availablePeople={availablePeople}
              onAddPeople={onAddPeopleToSegment}
            />
          ) : (
            <Input
              id="workspace-people-search"
              placeholder="Search people…"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-10"
              aria-label="Search workspace people"
            />
          )}
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            if (
              value === "all" ||
              PERSON_CATEGORY_OPTIONS.some((option) => option.value === value)
            ) {
              onCategoryFilterChange(value as PersonCategory | "all")
            }
          }}
        >
          <SelectTrigger
            id="workspace-people-category"
            size="sm"
            className="h-10 w-full"
            aria-label="Filter workspace people by role"
          >
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All roles</SelectItem>
            {PERSON_CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit ? (
          <CreatePersonDialog
            triggerClassName="h-8 w-full justify-center rounded-xl px-2.5 md:w-auto"
            people={people}
          />
        ) : null}
      </div>
    )
  }
)
