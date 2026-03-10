"use client"

import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  FILTER_CATEGORY_PREFIX,
  FILTER_SOURCE_PREFIX,
  FILTER_STATUS_PREFIX,
  FILTER_VISIBILITY_PREFIX,
  STATUS_META,
} from "../constants"
import type { DocumentStatus } from "../types"

type OnToggleFilter = (token: string) => void

function categoryToken(category: string) {
  return `${FILTER_CATEGORY_PREFIX}${encodeURIComponent(category)}`
}

type SourceFiltersSectionProps = {
  activeFilters: string[]
  hasRoadmapDocuments: boolean
  onToggleFilter: OnToggleFilter
}

export function SourceFiltersSection({
  activeFilters,
  hasRoadmapDocuments,
  onToggleFilter,
}: SourceFiltersSectionProps) {
  return (
    <>
      <DropdownMenuLabel>Source</DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        checked={activeFilters.includes(`${FILTER_SOURCE_PREFIX}upload`)}
        onCheckedChange={() => onToggleFilter(`${FILTER_SOURCE_PREFIX}upload`)}
      >
        Uploads
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={activeFilters.includes(`${FILTER_SOURCE_PREFIX}policy`)}
        onCheckedChange={() => onToggleFilter(`${FILTER_SOURCE_PREFIX}policy`)}
      >
        Policies
      </DropdownMenuCheckboxItem>
      {hasRoadmapDocuments ? (
        <DropdownMenuCheckboxItem
          checked={activeFilters.includes(`${FILTER_SOURCE_PREFIX}roadmap`)}
          onCheckedChange={() => onToggleFilter(`${FILTER_SOURCE_PREFIX}roadmap`)}
        >
          Roadmap
        </DropdownMenuCheckboxItem>
      ) : null}
    </>
  )
}

type StatusFiltersSectionProps = {
  activeFilters: string[]
  onToggleFilter: OnToggleFilter
}

export function StatusFiltersSection({
  activeFilters,
  onToggleFilter,
}: StatusFiltersSectionProps) {
  return (
    <>
      <DropdownMenuLabel>Status</DropdownMenuLabel>
      {(Object.keys(STATUS_META) as DocumentStatus[]).map((status) => (
        <DropdownMenuCheckboxItem
          key={status}
          checked={activeFilters.includes(`${FILTER_STATUS_PREFIX}${status}`)}
          onCheckedChange={() => onToggleFilter(`${FILTER_STATUS_PREFIX}${status}`)}
        >
          {STATUS_META[status].label}
        </DropdownMenuCheckboxItem>
      ))}
    </>
  )
}

type VisibilityFiltersSectionProps = {
  activeFilters: string[]
  onToggleFilter: OnToggleFilter
}

export function VisibilityFiltersSection({
  activeFilters,
  onToggleFilter,
}: VisibilityFiltersSectionProps) {
  return (
    <>
      <DropdownMenuLabel>Visibility</DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        checked={activeFilters.includes(`${FILTER_VISIBILITY_PREFIX}private`)}
        onCheckedChange={() => onToggleFilter(`${FILTER_VISIBILITY_PREFIX}private`)}
      >
        Private
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={activeFilters.includes(`${FILTER_VISIBILITY_PREFIX}public`)}
        onCheckedChange={() => onToggleFilter(`${FILTER_VISIBILITY_PREFIX}public`)}
      >
        Public
      </DropdownMenuCheckboxItem>
    </>
  )
}

type CategoryFiltersSectionProps = {
  activeFilters: string[]
  categoryOptions: string[]
  onToggleFilter: OnToggleFilter
}

export function CategoryFiltersSection({
  activeFilters,
  categoryOptions,
  onToggleFilter,
}: CategoryFiltersSectionProps) {
  return (
    <>
      <DropdownMenuLabel>Category</DropdownMenuLabel>
      {categoryOptions.map((category) => {
        const token = categoryToken(category)
        return (
          <DropdownMenuCheckboxItem
            key={token}
            checked={activeFilters.includes(token)}
            onCheckedChange={() => onToggleFilter(token)}
          >
            {category}
          </DropdownMenuCheckboxItem>
        )
      })}
    </>
  )
}
