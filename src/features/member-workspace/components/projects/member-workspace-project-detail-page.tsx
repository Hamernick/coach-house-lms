"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LinkSimple, SquareHalf } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"

import {
  AssetsFilesTab,
  Breadcrumbs,
  Button,
  KeyFeaturesColumns,
  NotesTab,
  OutcomesList,
  ProjectTasksTab,
  ScopeColumns,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TAG_OPTIONS,
  TaskQuickCreateModal,
  TimelineGantt,
  type CreateTaskContext,
  type ProjectDetails,
  type TaskQuickCreateSubmitValue,
  type User,
  WorkstreamTab,
} from "@/features/platform-admin-dashboard"
import styles from "./member-workspace-projects-surface-theme.module.css"
import { MemberWorkspaceProjectDetailHeader } from "./member-workspace-project-detail-header"
import {
  createProjectAssets,
  deleteProjectAsset,
  updateProjectAsset,
} from "./project-assets-api"
import type {
  MemberWorkspaceAdminOrganizationSummary,
  MemberWorkspaceCreateProjectNoteInput,
  MemberWorkspaceCreateProjectQuickLinkInput,
  MemberWorkspaceCreateTaskInput,
  MemberWorkspaceUpdateProjectNoteInput,
  MemberWorkspaceUpdateProjectQuickLinkInput,
  MemberWorkspacePersonOption,
} from "../../types"
import { MemberWorkspaceProjectRightMetaPanel } from "./member-workspace-project-right-meta-panel"

type MemberWorkspaceProjectDetailPageProps = {
  project: ProjectDetails
  assigneeOptions: MemberWorkspacePersonOption[]
  currentUser: User
  organizationSummary: MemberWorkspaceAdminOrganizationSummary
  createTaskAction?: (
    input: MemberWorkspaceCreateTaskInput,
  ) => Promise<{ ok: true; taskId: string } | { error: string }>
  updateTaskStatusAction?: (
    taskId: string,
    nextStatus: "todo" | "in-progress" | "done",
  ) => Promise<{ ok: true; taskId: string; status: "todo" | "in-progress" | "done" } | { error: string }>
  updateTaskOrderAction?: (
    projectId: string,
    orderedTaskIds: string[],
  ) => Promise<{ ok: true; projectId: string } | { error: string }>
  createNoteAction?: (
    input: MemberWorkspaceCreateProjectNoteInput,
  ) => Promise<{ ok: true; noteId: string } | { error: string }>
  updateNoteAction?: (
    input: MemberWorkspaceUpdateProjectNoteInput,
  ) => Promise<{ ok: true; noteId: string } | { error: string }>
  deleteNoteAction?: (input: {
    noteId: string
    projectId: string
  }) => Promise<{ ok: true } | { error: string }>
  createQuickLinkAction?: (
    input: MemberWorkspaceCreateProjectQuickLinkInput,
  ) => Promise<{ ok: true; linkId: string } | { error: string }>
  updateQuickLinkAction?: (
    input: MemberWorkspaceUpdateProjectQuickLinkInput,
  ) => Promise<{ ok: true; linkId: string } | { error: string }>
  deleteQuickLinkAction?: (input: {
    linkId: string
    projectId: string
  }) => Promise<{ ok: true } | { error: string }>
}

export function MemberWorkspaceProjectDetailPage({
  project,
  assigneeOptions,
  currentUser,
  organizationSummary,
  createTaskAction,
  updateTaskStatusAction,
  updateTaskOrderAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  createQuickLinkAction,
  updateQuickLinkAction,
  deleteQuickLinkAction,
}: MemberWorkspaceProjectDetailPageProps) {
  const router = useRouter()
  const [showMeta, setShowMeta] = useState(true)
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false)
  const [taskCreateContext, setTaskCreateContext] = useState<CreateTaskContext | undefined>()

  const breadcrumbs = useMemo(
    () => [
      { label: "Projects", href: "/projects" },
      { label: project.name },
    ],
    [project.name],
  )

  const copyLink = useCallback(async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not available")
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied")
    } catch {
      toast.error("Failed to copy link")
    }
  }, [])

  const taskProjectOptions = useMemo(
    () => [{ id: project.id, label: project.name }],
    [project.id, project.name],
  )

  const workstreamOptionsByProjectId = useMemo(
    () => ({
      [project.id]: project.workstreams.map((workstream) => ({
        id: workstream.id,
        label: workstream.name,
      })),
    }),
    [project.id, project.workstreams],
  )

  const openTaskCreate = useCallback((context?: CreateTaskContext) => {
    setTaskCreateContext({
      projectId: project.id,
      ...context,
    })
    setIsTaskCreateOpen(true)
  }, [project.id])

  const handleCreateAsset = useCallback(
    async (input: {
      title?: string
      description?: string
      link?: string
      files: File[]
    }) => {
      await createProjectAssets({
        projectId: project.id,
        title: input.title,
        description: input.description,
        link: input.link,
        files: input.files,
      })
    },
    [project.id],
  )

  const handleUpdateAsset = useCallback(
    async (
      assetId: string,
      input: {
        title?: string
        description?: string
        link?: string
        files: File[]
      },
    ) => {
      await updateProjectAsset({
        projectId: project.id,
        assetId,
        name: input.title?.trim() || "Untitled asset",
        description: input.description,
        link: input.link,
      })
    },
    [project.id],
  )

  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      await deleteProjectAsset({
        projectId: project.id,
        assetId,
      })
    },
    [project.id],
  )

  const handleTaskSubmit = useCallback(
    async (value: TaskQuickCreateSubmitValue) => {
      if (!createTaskAction) {
        return { error: "Task creation is unavailable." }
      }

      const tagLabel = TAG_OPTIONS.find((option) => option.id === value.tagId)?.label
      const startDate = value.startDate?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10)
      const endDate = value.targetDate?.toISOString().slice(0, 10) ?? startDate
      const result = await createTaskAction({
        projectId: value.projectId,
        title: value.title,
        description: value.description,
        status: value.status,
        startDate,
        endDate,
        priority: value.priorityId,
        tagLabel,
        workstreamName: value.workstreamName,
        assigneeUserId: value.assigneeId,
      })

      if ("error" in result) {
        return result
      }

      router.refresh()
      return result
    },
    [createTaskAction, router],
  )

  return (
    <div
      className={`${styles.surface} -mx-[var(--shell-content-pad)] -mb-[var(--shell-content-pad)] -mt-[var(--shell-content-pad)] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy link"
            onClick={copyLink}
          >
            <LinkSimple className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={!showMeta}
            aria-label={showMeta ? "Collapse meta panel" : "Expand meta panel"}
            className={showMeta ? "bg-muted" : ""}
            onClick={() => setShowMeta((value) => !value)}
          >
            <SquareHalf className="h-4 w-4" weight="duotone" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="px-4">
            <div className="mx-auto w-full max-w-7xl">
              <div
                className={
                  "mt-0 grid grid-cols-1 gap-15 " +
                  (showMeta
                    ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,320px)]"
                    : "lg:grid-cols-[minmax(0,1fr)_minmax(0,0px)]")
                }
              >
                <div className="space-y-6 pb-8 pt-4">
                  <MemberWorkspaceProjectDetailHeader project={project} />

                  <Tabs defaultValue="overview">
                    <TabsList className="w-full gap-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="workstream">Workstream</TabsTrigger>
                      <TabsTrigger value="tasks">Tasks</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="assets">Assets &amp; Files</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                      <div className="space-y-10">
                        <p className="text-sm leading-6 text-muted-foreground">
                          {project.description}
                        </p>
                        <ScopeColumns scope={project.scope} />
                        <OutcomesList outcomes={project.outcomes} />
                        <KeyFeaturesColumns features={project.keyFeatures} />
                        <TimelineGantt tasks={project.timelineTasks} />
                      </div>
                    </TabsContent>

                    <TabsContent value="workstream">
                      <WorkstreamTab
                        workstreams={project.workstreams}
                        onCreateTask={openTaskCreate}
                      />
                    </TabsContent>

                    <TabsContent value="tasks">
                      <ProjectTasksTab
                        project={project}
                        onCreateTask={openTaskCreate}
                        onUpdateTaskStatus={updateTaskStatusAction}
                        onReorderTasks={updateTaskOrderAction}
                      />
                    </TabsContent>

                    <TabsContent value="notes">
                      <NotesTab
                        notes={project.notes || []}
                        currentUser={currentUser}
                        createNoteAction={createNoteAction}
                        updateNoteAction={updateNoteAction}
                        deleteNoteAction={deleteNoteAction}
                        projectId={project.id}
                      />
                    </TabsContent>

                    <TabsContent value="assets">
                      <AssetsFilesTab
                        files={project.files}
                        onCreateAsset={handleCreateAsset}
                        onUpdateAsset={handleUpdateAsset}
                        onDeleteAsset={handleDeleteAsset}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <AnimatePresence initial={false}>
                  {showMeta ? (
                    <motion.div
                      key="meta-panel"
                      initial={{ x: 80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 80, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 26 }}
                      className="pb-8 lg:border-l lg:border-border lg:pl-6"
                    >
                      <MemberWorkspaceProjectRightMetaPanel
                        project={project}
                        organizationSummary={organizationSummary}
                        createQuickLinkAction={createQuickLinkAction}
                        updateQuickLinkAction={updateQuickLinkAction}
                        deleteQuickLinkAction={deleteQuickLinkAction}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mt-auto" />
      </div>

      <TaskQuickCreateModal
        open={isTaskCreateOpen}
        onClose={() => {
          setIsTaskCreateOpen(false)
          setTaskCreateContext(undefined)
        }}
        context={taskCreateContext}
        projectOptions={taskProjectOptions}
        workstreamOptionsByProjectId={workstreamOptionsByProjectId}
        assigneeOptions={assigneeOptions}
        onSubmitTask={handleTaskSubmit}
      />
    </div>
  )
}
