"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Empty } from "@/components/ui/empty"
import {
  ChipOverflow,
  type PlatformAdminDashboardLabProject,
} from "@/features/platform-admin-dashboard"
import type {
  MemberWorkspaceCreateProjectFormInput,
  MemberWorkspacePersonOption,
  MemberWorkspaceProjectOrganizationOption,
  MemberWorkspaceStorageMode,
  MemberWorkspaceWorkstreamCategory,
} from "../../types"
import { MemberWorkspaceProjectBoardView } from "./member-workspace-project-board-view"
import { MemberWorkspaceProjectCardsView } from "./member-workspace-project-cards-view"
import {
  computeMemberWorkspaceProjectFilterCounts,
  filterMemberWorkspaceProjects,
} from "./member-workspace-project-filters"
import { MemberWorkspaceProjectFilterPopover } from "./member-workspace-project-filter-popover"
import { MemberWorkspaceProjectTimelineView } from "./member-workspace-project-timeline-view"
import { MemberWorkspaceProjectViewOptionsPopover } from "./member-workspace-project-view-options-popover"
import { MemberWorkspaceProjectWizard } from "./member-workspace-project-wizard"
import { MemberWorkspaceProjectsFilteredEmpty } from "./member-workspace-projects-filtered-empty"
import { MemberWorkspaceClearStarterDataButton } from "../shared/member-workspace-clear-starter-data-button"
import styles from "./member-workspace-projects-surface-theme.module.css"
import {
  applyOrganizationCoachFilterToParams,
  computeOrganizationCoachAssignmentCoverage,
  filterProjectsByOrganizationCoach,
  normalizeOrganizationCoachFilter,
  ORGANIZATION_COACH_FILTER_ALL,
  OrganizationCoachAssignmentOperationsBar,
  type OrganizationCoachFilterValue,
  type OrganizationCoachAssignmentAction,
  type OrganizationCoachOption,
  type OrganizationCoachScopeStatus,
  type SetOrganizationCoachScopeAction,
} from "@/features/organization-coach-assignments"
import {
  applyViewOptionsToParams,
  DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS as DEFAULT_VIEW_OPTIONS,
  chipsToParams,
  paramsToViewOptions,
  paramsToChips,
  type MemberWorkspaceProjectFilterChip as FilterChip,
} from "./member-workspace-project-view-options"

type MemberWorkspaceProjectsPageProps = {
  projects: PlatformAdminDashboardLabProject[]
  storageMode: MemberWorkspaceStorageMode
  canResetStarterData: boolean
  starterProjectCount: number
  clearStarterDataAction?: () => Promise<{ ok: true } | { error: string }>
  createProjectAction?: (
    input: MemberWorkspaceCreateProjectFormInput
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateProjectAction?: (
    projectId: string,
    input: MemberWorkspaceCreateProjectFormInput
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateProjectScheduleAction?: (
    projectId: string,
    startDate: string,
    endDate: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateProjectStatusAction?: (
    projectId: string,
    status: PlatformAdminDashboardLabProject["status"]
  ) => Promise<{ ok: true; id: string } | { error: string }>
  canCreateProjects: boolean
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
  assigneeOptions: MemberWorkspacePersonOption[]
  coachOptions?: OrganizationCoachOption[]
  canManageCoachAssignments?: boolean
  updateCoachAssignmentAction?: OrganizationCoachAssignmentAction
  coachScopeStatus?: OrganizationCoachScopeStatus
  setCoachScopeAction?: SetOrganizationCoachScopeAction
  showAssignedOrganizationsEmpty?: boolean
  scope: "organization" | "platform-admin"
  workstreamCategories?: MemberWorkspaceWorkstreamCategory[]
  createWorkstreamCategoryAction?: (
    name: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateWorkstreamCategoryAction?: (
    categoryId: string,
    name: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
  deleteWorkstreamCategoryAction?: (
    categoryId: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
  restoreWorkstreamDefaultsAction?: () => Promise<
    { ok: true } | { error: string }
  >
  updateProjectWorkstreamAction?: (
    projectId: string,
    categoryId: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
}

export function MemberWorkspaceProjectsPage(
  props: MemberWorkspaceProjectsPageProps
) {
  const {
    projects,
    storageMode: _storageMode,
    canResetStarterData,
    starterProjectCount: _starterProjectCount,
    clearStarterDataAction,
    createProjectAction,
    updateProjectAction,
    updateProjectScheduleAction,
    updateProjectStatusAction,
    canCreateProjects,
    organizationOptions,
    scope,
    coachOptions = [],
    canManageCoachAssignments = false,
    updateCoachAssignmentAction,
    coachScopeStatus = {
      available: false,
      assignedOnlyEnabled: false,
      activatedAt: null,
    },
    setCoachScopeAction,
    showAssignedOrganizationsEmpty = false,
    workstreamCategories = [],
    createWorkstreamCategoryAction,
    updateWorkstreamCategoryAction,
    deleteWorkstreamCategoryAction,
    restoreWorkstreamDefaultsAction,
    updateProjectWorkstreamAction,
  } = props
  const assigneeOptions = props.assigneeOptions ?? []
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<FilterChip[]>([])
  const [coachFilter, setCoachFilter] = useState<OrganizationCoachFilterValue>(
    ORGANIZATION_COACH_FILTER_ALL
  )
  const [viewOptions, setViewOptions] = useState(DEFAULT_VIEW_OPTIONS)
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false)
  const [editingProject, setEditingProject] =
    useState<PlatformAdminDashboardLabProject | null>(null)

  const prevParamsRef = useRef("")

  useEffect(() => {
    const currentParams = searchParams.toString()
    const currentStateKey = `${currentParams}|${coachOptions
      .map((coach) => coach.id)
      .join(",")}`
    if (prevParamsRef.current === currentStateKey) return

    prevParamsRef.current = currentStateKey
    const params = new URLSearchParams(currentParams)
    setFilters(paramsToChips(params))
    setCoachFilter(
      normalizeOrganizationCoachFilter({
        coachOptions,
        value: params.get("coach"),
      })
    )
    setViewOptions(paramsToViewOptions(params))
  }, [coachOptions, searchParams])

  const replaceSearchState = ({
    nextFilters = filters,
    nextCoachFilter = coachFilter,
    nextViewOptions = viewOptions,
  }: {
    nextFilters?: FilterChip[]
    nextCoachFilter?: OrganizationCoachFilterValue
    nextViewOptions?: typeof viewOptions
  }) => {
    const params = chipsToParams(nextFilters)
    applyOrganizationCoachFilterToParams(params, nextCoachFilter)
    applyViewOptionsToParams(params, nextViewOptions)
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }

  const handleFiltersChange = (nextFilters: FilterChip[]) => {
    setFilters(nextFilters)
    replaceSearchState({ nextFilters })
  }

  const handleViewOptionsChange = (nextViewOptions: typeof viewOptions) => {
    setViewOptions(nextViewOptions)
    replaceSearchState({ nextViewOptions })
  }

  const handleCoachFilterChange = (
    nextCoachFilter: OrganizationCoachFilterValue
  ) => {
    setCoachFilter(nextCoachFilter)
    replaceSearchState({ nextCoachFilter })
  }

  const handleClearAllFilters = () => {
    setFilters([])
    setCoachFilter(ORGANIZATION_COACH_FILTER_ALL)
    replaceSearchState({
      nextFilters: [],
      nextCoachFilter: ORGANIZATION_COACH_FILTER_ALL,
    })
  }

  const coachAssignmentCoverage = useMemo(
    () => computeOrganizationCoachAssignmentCoverage(projects),
    [projects]
  )
  const coachFilteredProjects = useMemo(
    () =>
      filterProjectsByOrganizationCoach({
        projects,
        value: coachFilter,
      }),
    [coachFilter, projects]
  )

  const filteredProjects = useMemo(
    () =>
      filterMemberWorkspaceProjects({
        filters,
        projects: coachFilteredProjects,
        viewOptions,
        workstreamCategories,
      }),
    [coachFilteredProjects, filters, viewOptions, workstreamCategories]
  )

  const counts = useMemo(
    () =>
      computeMemberWorkspaceProjectFilterCounts({
        filters,
        projects: coachFilteredProjects,
        viewOptions,
        workstreamCategories,
      }),
    [coachFilteredProjects, filters, viewOptions, workstreamCategories]
  )
  const hasActiveFilters =
    filters.length > 0 || coachFilter !== ORGANIZATION_COACH_FILTER_ALL
  const showFilteredEmpty = hasActiveFilters && filteredProjects.length === 0

  return (
    <>
      <div
        className={`${styles.surface} bg-background -mx-[var(--shell-content-pad)] -mt-[var(--shell-content-pad)] -mb-[var(--shell-content-pad)] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}
      >
        <header className="border-border/40 flex flex-col border-b">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <p className="text-foreground text-base font-medium">
                Organizations
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canResetStarterData && clearStarterDataAction ? (
                <MemberWorkspaceClearStarterDataButton
                  clearStarterDataAction={clearStarterDataAction}
                />
              ) : null}
            </div>
          </div>

          {canManageCoachAssignments && setCoachScopeAction ? (
            <div className="border-border border-b px-4 py-3">
              <OrganizationCoachAssignmentOperationsBar
                coachOptions={coachOptions}
                coverage={coachAssignmentCoverage}
                value={coachFilter}
                onValueChange={handleCoachFilterChange}
                scopeStatus={coachScopeStatus}
                setScopeAction={setCoachScopeAction}
              />
            </div>
          ) : null}

          {!showAssignedOrganizationsEmpty ? (
            <div className="flex items-center justify-between px-4 pt-3 pb-3">
              <div className="flex items-center gap-2">
                <MemberWorkspaceProjectFilterPopover
                  projects={coachFilteredProjects}
                  initialChips={filters}
                  onApply={handleFiltersChange}
                  onClear={() => handleFiltersChange([])}
                  counts={counts}
                />
                <ChipOverflow
                  chips={filters}
                  onRemove={(key, value) =>
                    handleFiltersChange(
                      filters.filter(
                        (chip) => !(chip.key === key && chip.value === value)
                      )
                    )
                  }
                  maxVisible={6}
                />
              </div>
              <div className="flex items-center gap-2">
                <MemberWorkspaceProjectViewOptionsPopover
                  options={viewOptions}
                  onChange={handleViewOptionsChange}
                />
              </div>
            </div>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {showAssignedOrganizationsEmpty ? (
            <div className="h-full p-6">
              <Empty
                title="No assigned organizations"
                description="Ask a developer to assign an organization to your coach account."
                variant="subtle"
              />
            </div>
          ) : null}
          {!showAssignedOrganizationsEmpty && showFilteredEmpty ? (
            <MemberWorkspaceProjectsFilteredEmpty
              onClear={handleClearAllFilters}
            />
          ) : null}
          {!showAssignedOrganizationsEmpty &&
          !showFilteredEmpty &&
          viewOptions.viewType === "timeline" ? (
            <MemberWorkspaceProjectTimelineView
              projects={filteredProjects}
              updateProjectScheduleAction={updateProjectScheduleAction}
            />
          ) : null}
          {!showAssignedOrganizationsEmpty &&
          !showFilteredEmpty &&
          viewOptions.viewType === "list" ? (
            <MemberWorkspaceProjectCardsView
              projects={filteredProjects}
              visibleProperties={viewOptions.properties}
              onCreateProject={
                canCreateProjects
                  ? () => {
                      setEditingProject(null)
                      setIsProjectWizardOpen(true)
                    }
                  : undefined
              }
              onEditProject={
                canCreateProjects
                  ? (project) => {
                      setEditingProject(project)
                      setIsProjectWizardOpen(true)
                    }
                  : undefined
              }
              scope={scope}
              coachOptions={coachOptions}
              canManageCoachAssignments={canManageCoachAssignments}
              updateCoachAssignmentAction={updateCoachAssignmentAction}
              canUnassignCoachAssignments={
                !coachScopeStatus.assignedOnlyEnabled
              }
            />
          ) : null}
          {!showAssignedOrganizationsEmpty &&
          !showFilteredEmpty &&
          viewOptions.viewType === "board" ? (
            <MemberWorkspaceProjectBoardView
              projects={filteredProjects}
              showClosedProjects={viewOptions.showClosedProjects}
              visibleProperties={viewOptions.properties}
              updateProjectStatusAction={updateProjectStatusAction}
              workstreamCategories={workstreamCategories}
              createWorkstreamCategoryAction={createWorkstreamCategoryAction}
              updateWorkstreamCategoryAction={updateWorkstreamCategoryAction}
              deleteWorkstreamCategoryAction={deleteWorkstreamCategoryAction}
              restoreWorkstreamDefaultsAction={restoreWorkstreamDefaultsAction}
              updateProjectWorkstreamAction={updateProjectWorkstreamAction}
              coachOptions={coachOptions}
              canManageCoachAssignments={canManageCoachAssignments}
              updateCoachAssignmentAction={updateCoachAssignmentAction}
              canUnassignCoachAssignments={
                !coachScopeStatus.assignedOnlyEnabled
              }
              onAddProject={
                canCreateProjects
                  ? () => {
                      setEditingProject(null)
                      setIsProjectWizardOpen(true)
                    }
                  : undefined
              }
              onEditProject={
                canCreateProjects
                  ? (project) => {
                      setEditingProject(project)
                      setIsProjectWizardOpen(true)
                    }
                  : undefined
              }
            />
          ) : null}
        </div>
      </div>

      {createProjectAction ? (
        <MemberWorkspaceProjectWizard
          open={isProjectWizardOpen}
          onOpenChange={(nextOpen) => {
            setIsProjectWizardOpen(nextOpen)
            if (!nextOpen) {
              setEditingProject(null)
            }
          }}
          initialProject={editingProject}
          organizationOptions={organizationOptions}
          assigneeOptions={assigneeOptions}
          createProjectAction={createProjectAction}
          updateProjectAction={updateProjectAction}
        />
      ) : null}
    </>
  )
}
