"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Plus } from "@phosphor-icons/react/dist/ssr"

import {
  ChipOverflow,
  type PlatformAdminDashboardLabProject,
} from "@/features/platform-admin-dashboard"
import { Button } from "@/components/ui/button"
import type {
  MemberWorkspaceCreateProjectFormInput,
  MemberWorkspacePersonOption,
  MemberWorkspaceProjectOrganizationOption,
  MemberWorkspaceStorageMode,
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
import styles from "./member-workspace-projects-surface-theme.module.css"
import {
  applyViewOptionsToParams,
  DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS as DEFAULT_VIEW_OPTIONS,
  chipsToParams,
  paramsToViewOptions,
  paramsToChips,
  type MemberWorkspaceProjectFilterChip as FilterChip,
} from "./member-workspace-project-view-options"

export function MemberWorkspaceProjectsPage(props: {
  projects: PlatformAdminDashboardLabProject[]
  storageMode: MemberWorkspaceStorageMode
  canResetStarterData: boolean
  starterProjectCount: number
  resetStarterProjectsAction?: () => Promise<{ ok: true } | { error: string }>
  createProjectAction?: (
    input: MemberWorkspaceCreateProjectFormInput,
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateProjectAction?: (
    projectId: string,
    input: MemberWorkspaceCreateProjectFormInput,
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateProjectScheduleAction?: (
    projectId: string,
    startDate: string,
    endDate: string,
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateProjectStatusAction?: (
    projectId: string,
    status: PlatformAdminDashboardLabProject["status"],
  ) => Promise<{ ok: true; id: string } | { error: string }>
  canCreateProjects: boolean
  organizationOptions: MemberWorkspaceProjectOrganizationOption[]
  assigneeOptions: MemberWorkspacePersonOption[]
  scope: "organization" | "platform-admin"
}) {
  const {
    projects,
    storageMode: _storageMode,
    canResetStarterData: _canResetStarterData,
    starterProjectCount: _starterProjectCount,
    resetStarterProjectsAction: _resetStarterProjectsAction,
    createProjectAction,
    updateProjectAction,
    updateProjectScheduleAction,
    updateProjectStatusAction,
    canCreateProjects,
    organizationOptions,
    scope,
  } = props
  const assigneeOptions = props.assigneeOptions ?? []
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<FilterChip[]>([])
  const [viewOptions, setViewOptions] = useState(DEFAULT_VIEW_OPTIONS)
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<PlatformAdminDashboardLabProject | null>(null)

  const prevParamsRef = useRef("")

  useEffect(() => {
    const currentParams = searchParams.toString()
    if (prevParamsRef.current === currentParams) return

    prevParamsRef.current = currentParams
    const params = new URLSearchParams(currentParams)
    setFilters(paramsToChips(params))
    setViewOptions(paramsToViewOptions(params))
  }, [searchParams])

  const replaceSearchState = ({
    nextFilters = filters,
    nextViewOptions = viewOptions,
  }: {
    nextFilters?: FilterChip[]
    nextViewOptions?: typeof viewOptions
  }) => {
    const params = chipsToParams(nextFilters)
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

  const filteredProjects = useMemo(
    () =>
      filterMemberWorkspaceProjects({
        filters,
        projects,
        viewOptions,
      }),
    [filters, projects, viewOptions],
  )

  const counts = useMemo(
    () =>
      computeMemberWorkspaceProjectFilterCounts({
        filters,
        projects,
        viewOptions,
      }),
    [filters, projects, viewOptions],
  )

  return (
    <>
      <div className={`${styles.surface} -mx-[var(--shell-content-pad)] -mb-[var(--shell-content-pad)] -mt-[var(--shell-content-pad)] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background`}>
        <header className="flex flex-col border-b border-border/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <p className="text-base font-medium text-foreground">Projects</p>
            </div>
            <div className="flex items-center gap-2">
              {canCreateProjects ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setEditingProject(null)
                    setIsProjectWizardOpen(true)
                  }}
                >
                  <Plus data-icon="inline-start" weight="bold" />
                  Add Project
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pb-3 pt-3">
            <div className="flex items-center gap-2">
              <MemberWorkspaceProjectFilterPopover
                projects={projects}
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
                      (chip) => !(chip.key === key && chip.value === value),
                    ),
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
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {viewOptions.viewType === "timeline" ? (
            <MemberWorkspaceProjectTimelineView
              projects={filteredProjects}
              updateProjectScheduleAction={updateProjectScheduleAction}
            />
          ) : null}
          {viewOptions.viewType === "list" ? (
            <MemberWorkspaceProjectCardsView
              projects={filteredProjects}
              visibleProperties={viewOptions.properties}
              onCreateProject={canCreateProjects ? () => {
                setEditingProject(null)
                setIsProjectWizardOpen(true)
              } : undefined}
              onEditProject={canCreateProjects ? (project) => {
                setEditingProject(project)
                setIsProjectWizardOpen(true)
              } : undefined}
              scope={scope}
            />
          ) : null}
          {viewOptions.viewType === "board" ? (
            <MemberWorkspaceProjectBoardView
              projects={filteredProjects}
              showClosedProjects={viewOptions.showClosedProjects}
              visibleProperties={viewOptions.properties}
              updateProjectStatusAction={updateProjectStatusAction}
              onAddProject={canCreateProjects ? () => {
                setEditingProject(null)
                setIsProjectWizardOpen(true)
              } : undefined}
              onEditProject={canCreateProjects ? (project) => {
                setEditingProject(project)
                setIsProjectWizardOpen(true)
              } : undefined}
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
