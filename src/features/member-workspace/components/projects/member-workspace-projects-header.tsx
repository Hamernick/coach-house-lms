"use client"

import {
  ChipOverflow,
  type PlatformAdminDashboardLabProject,
} from "@/features/platform-admin-dashboard"
import {
  OrganizationCoachAssignmentOperationsBar,
  type AssignAllOrganizationCoachesAction,
  type OrganizationCoachAssignmentCoverage,
  type OrganizationCoachFilterValue,
  type OrganizationCoachOption,
  type OrganizationCoachScopeStatus,
  type SetOrganizationCoachScopeAction,
} from "@/features/organization-coach-assignments"
import {
  OrganizationKanbanVisibilityFilter,
  type OrganizationKanbanVisibilityMode,
} from "@/features/organization-kanban-visibility"
import type { MemberWorkspaceProjectFilterCounts } from "./member-workspace-project-filters"
import { MemberWorkspaceProjectFilterPopover } from "./member-workspace-project-filter-popover"
import { MemberWorkspaceProjectViewOptionsPopover } from "./member-workspace-project-view-options-popover"
import type {
  MemberWorkspaceProjectFilterChip,
  MemberWorkspaceProjectViewOptions,
} from "./member-workspace-project-view-options"
import { MemberWorkspaceClearStarterDataButton } from "../shared/member-workspace-clear-starter-data-button"

export function MemberWorkspaceProjectsHeader({
  assignAllCoachesAction,
  canManageCoachAssignments,
  canResetStarterData,
  clearStarterDataAction,
  coachAssignmentCoverage,
  coachFilter,
  coachOptions,
  coachScopeStatus,
  counts,
  filters,
  kanbanVisibility,
  onCoachFilterChange,
  onFiltersChange,
  onKanbanVisibilityChange,
  onViewOptionsChange,
  projects,
  setCoachScopeAction,
  showAssignedOrganizationsEmpty,
  viewOptions,
}: {
  assignAllCoachesAction?: AssignAllOrganizationCoachesAction
  canManageCoachAssignments: boolean
  canResetStarterData: boolean
  clearStarterDataAction?: () => Promise<{ ok: true } | { error: string }>
  coachAssignmentCoverage: OrganizationCoachAssignmentCoverage
  coachFilter: OrganizationCoachFilterValue
  coachOptions: OrganizationCoachOption[]
  coachScopeStatus: OrganizationCoachScopeStatus
  counts: MemberWorkspaceProjectFilterCounts
  filters: MemberWorkspaceProjectFilterChip[]
  kanbanVisibility: {
    available: boolean
    hiddenCount: number
    mode: OrganizationKanbanVisibilityMode
    visibleCount: number
  }
  onCoachFilterChange: (value: OrganizationCoachFilterValue) => void
  onFiltersChange: (filters: MemberWorkspaceProjectFilterChip[]) => void
  onKanbanVisibilityChange: (mode: OrganizationKanbanVisibilityMode) => void
  onViewOptionsChange: (options: MemberWorkspaceProjectViewOptions) => void
  projects: PlatformAdminDashboardLabProject[]
  setCoachScopeAction?: SetOrganizationCoachScopeAction
  showAssignedOrganizationsEmpty: boolean
  viewOptions: MemberWorkspaceProjectViewOptions
}) {
  return (
    <header className="border-border/40 flex flex-col border-b">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <p className="text-foreground text-base font-medium">Organizations</p>
        {canResetStarterData && clearStarterDataAction ? (
          <MemberWorkspaceClearStarterDataButton
            clearStarterDataAction={clearStarterDataAction}
          />
        ) : null}
      </div>

      {canManageCoachAssignments &&
      assignAllCoachesAction &&
      setCoachScopeAction ? (
        <div className="border-border border-b px-4 py-3">
          <OrganizationCoachAssignmentOperationsBar
            assignAllAction={assignAllCoachesAction}
            coachOptions={coachOptions}
            coverage={coachAssignmentCoverage}
            value={coachFilter}
            onValueChange={onCoachFilterChange}
            scopeStatus={coachScopeStatus}
            setScopeAction={setCoachScopeAction}
          />
        </div>
      ) : null}

      {!showAssignedOrganizationsEmpty ? (
        <div className="flex flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <MemberWorkspaceProjectFilterPopover
              projects={projects}
              initialChips={filters}
              onApply={onFiltersChange}
              onClear={() => onFiltersChange([])}
              counts={counts}
            />
            <ChipOverflow
              chips={filters}
              onRemove={(key, value) =>
                onFiltersChange(
                  filters.filter(
                    (chip) => !(chip.key === key && chip.value === value)
                  )
                )
              }
              maxVisible={6}
            />
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2 sm:shrink-0 sm:justify-end">
            {kanbanVisibility.available ? (
              <OrganizationKanbanVisibilityFilter
                hiddenCount={kanbanVisibility.hiddenCount}
                onValueChange={onKanbanVisibilityChange}
                value={kanbanVisibility.mode}
                visibleCount={kanbanVisibility.visibleCount}
              />
            ) : null}
            {kanbanVisibility.mode === "visible" ? (
              <MemberWorkspaceProjectViewOptionsPopover
                options={viewOptions}
                onChange={onViewOptionsChange}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  )
}
