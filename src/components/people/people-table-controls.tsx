"use client"

import type { OrgPerson } from "@/actions/people"
import { CreatePersonDialog } from "@/components/people/create-person-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PERSON_CATEGORY_OPTIONS } from "@/lib/people/categories"

type PeopleTableControlsProps = {
  people: OrgPerson[]
  canEdit?: boolean
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  categoryFilter: OrgPerson["category"] | "all"
  onCategoryFilterChange: (value: OrgPerson["category"] | "all") => void
  layout?: "rail" | "inline"
}

export function PeopleTableControls({
  people,
  canEdit = true,
  globalFilter,
  onGlobalFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  layout = "rail",
}: PeopleTableControlsProps) {
  const isInline = layout === "inline"

  return (
    <div
      className={cn(
        "space-y-[var(--shell-rail-gap,1rem)]",
        isInline && "mb-3 flex flex-wrap items-center gap-2 space-y-0",
      )}
    >
      <div className={cn("space-y-2", isInline && "min-w-[220px] flex-1 space-y-0")}>
        <Input
          id="people-search"
          placeholder="Search people…"
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="h-10"
          aria-label="Search people"
        />
      </div>
      <div className={cn("space-y-2", isInline && "w-full min-w-[190px] space-y-0 sm:w-[220px]")}>
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            if (
              value === "all" ||
              PERSON_CATEGORY_OPTIONS.some((option) => option.value === value)
            ) {
              onCategoryFilterChange(value as OrgPerson["category"] | "all")
            }
          }}
        >
          <SelectTrigger
            id="people-category"
            size="sm"
            className="h-10 w-full"
            aria-label="Filter by category"
          >
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All categories</SelectItem>
            {PERSON_CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {canEdit ? (
        <div className={cn("pt-2", isInline && "ml-auto pt-0")}>
          <CreatePersonDialog
            triggerClassName={cn("h-10 w-full justify-center", isInline && "w-auto px-4")}
            people={people}
          />
        </div>
      ) : null}
    </div>
  )
}
