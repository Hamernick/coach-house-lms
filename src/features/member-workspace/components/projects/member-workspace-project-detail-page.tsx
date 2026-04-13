"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LinkSimple, SquareHalf } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumbs,
  Button,
  Separator,
  TAG_OPTIONS,
  TaskQuickCreateModal,
  type CreateTaskContext,
  type ProjectDetails,
  type TaskQuickCreateSubmitValue,
  type User,
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
  MemberWorkspaceCreateProjectFormInput,
  MemberWorkspaceCreateProjectNoteInput,
  MemberWorkspaceCreateProjectQuickLinkInput,
  MemberWorkspaceCreateTaskInput,
  MemberWorkspaceUpdateProjectNoteInput,
  MemberWorkspaceUpdateProjectQuickLinkInput,
  MemberWorkspacePersonOption,
} from "../../types"
import { MemberWorkspaceProjectRightMetaPanel } from "./member-workspace-project-right-meta-panel"
import {
  areMemberWorkspaceProjectDetailDraftsEqual,
  buildMemberWorkspaceProjectDetailDraft,
  buildMemberWorkspaceProjectUpdateInput,
  type MemberWorkspaceProjectDetailDraft,
} from "./member-workspace-project-detail-editing"
import { MemberWorkspaceProjectDetailTabs } from "./member-workspace-project-detail-tabs"

type MemberWorkspaceProjectDetailPageProps = {
  project: ProjectDetails
  assigneeOptions: MemberWorkspacePersonOption[]
  currentUser: User
  organizationSummary: MemberWorkspaceAdminOrganizationSummary
  canManageProject?: boolean
  createTaskAction?: (
    input: MemberWorkspaceCreateTaskInput
  ) => Promise<{ ok: true; taskId: string } | { error: string }>
  updateTaskAction?: (
    taskId: string,
    input: MemberWorkspaceCreateTaskInput
  ) => Promise<{ ok: true; taskId: string } | { error: string }>
  deleteTaskAction?: (
    taskId: string
  ) => Promise<{ ok: true; taskId: string; projectId: string } | { error: string }>
  updateProjectAction?: (
    projectId: string,
    input: MemberWorkspaceCreateProjectFormInput
  ) => Promise<{ ok: true; id: string } | { error: string }>
  updateTaskStatusAction?: (
    taskId: string,
    nextStatus: "todo" | "in-progress" | "done"
  ) => Promise<
    | { ok: true; taskId: string; status: "todo" | "in-progress" | "done" }
    | { error: string }
  >
  updateTaskOrderAction?: (
    projectId: string,
    orderedTaskIds: string[]
  ) => Promise<{ ok: true; projectId: string } | { error: string }>
  createNoteAction?: (
    input: MemberWorkspaceCreateProjectNoteInput
  ) => Promise<{ ok: true; noteId: string } | { error: string }>
  updateNoteAction?: (
    input: MemberWorkspaceUpdateProjectNoteInput
  ) => Promise<{ ok: true; noteId: string } | { error: string }>
  deleteNoteAction?: (input: {
    noteId: string
    projectId: string
  }) => Promise<{ ok: true } | { error: string }>
  createQuickLinkAction?: (
    input: MemberWorkspaceCreateProjectQuickLinkInput
  ) => Promise<{ ok: true; linkId: string } | { error: string }>
  updateQuickLinkAction?: (
    input: MemberWorkspaceUpdateProjectQuickLinkInput
  ) => Promise<{ ok: true; linkId: string } | { error: string }>
  deleteQuickLinkAction?: (input: {
    linkId: string
    projectId: string
  }) => Promise<{ ok: true } | { error: string }>
}

type ProjectDetailTopBarActionsProps = {
  hasProjectChanges: boolean
  isEditing: boolean
  isSavingProject: boolean
  showMeta: boolean
  onCancelProjectEditing: () => void
  onCopyLink: () => void
  onSaveProject: () => void
  onToggleMeta: () => void
}

async function uploadAssetsForProject({
  input,
  projectId,
}: {
  input: {
    title?: string
    description?: string
    link?: string
    files: File[]
  }
  projectId: string
}) {
  return createProjectAssets({
    projectId,
    title: input.title,
    description: input.description,
    link: input.link,
    files: input.files,
  })
}

function ProjectDetailTopBarActions({
  hasProjectChanges,
  isEditing,
  isSavingProject,
  showMeta,
  onCancelProjectEditing,
  onCopyLink,
  onSaveProject,
  onToggleMeta,
}: ProjectDetailTopBarActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isEditing ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelProjectEditing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasProjectChanges || isSavingProject}
            onClick={onSaveProject}
          >
            {isSavingProject ? "Saving..." : "Save changes"}
          </Button>
        </>
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Copy link"
        onClick={onCopyLink}
      >
        <LinkSimple className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={!showMeta}
        aria-label={showMeta ? "Collapse meta panel" : "Expand meta panel"}
        className={showMeta ? "bg-muted" : ""}
        onClick={onToggleMeta}
      >
        <SquareHalf className="h-4 w-4" weight="duotone" />
      </Button>
    </div>
  )
}

function useProjectAssetActions({
  canManageProject,
  projectId,
}: {
  canManageProject: boolean
  projectId: string
}) {
  const handleCreateAsset = useCallback(
    async (input: {
      title?: string
      description?: string
      link?: string
      files: File[]
    }) => {
      if (!canManageProject) {
        throw new Error("Asset editing is unavailable.")
      }

      await uploadAssetsForProject({
        input,
        projectId,
      })
    },
    [canManageProject, projectId],
  )

  const handleUploadNoteAssets = useCallback(
    async (input: {
      title?: string
      description?: string
      files: File[]
    }) => {
      if (!canManageProject) {
        throw new Error("Note uploads are unavailable.")
      }

      const response = await uploadAssetsForProject({
        input,
        projectId,
      })

      return response.assets
    },
    [canManageProject, projectId],
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
      if (!canManageProject) {
        throw new Error("Asset editing is unavailable.")
      }

      await updateProjectAsset({
        projectId,
        assetId,
        name: input.title?.trim() || "Untitled asset",
        description: input.description,
        link: input.link,
      })
    },
    [canManageProject, projectId],
  )

  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      if (!canManageProject) {
        throw new Error("Asset editing is unavailable.")
      }

      await deleteProjectAsset({
        projectId,
        assetId,
      })
    },
    [canManageProject, projectId],
  )

  return {
    handleCreateAsset,
    handleUploadNoteAssets,
    handleUpdateAsset,
    handleDeleteAsset,
  }
}

export function MemberWorkspaceProjectDetailPage({
  project,
  assigneeOptions,
  currentUser,
  organizationSummary,
  canManageProject: canManageProjectProp,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  updateProjectAction,
  updateTaskStatusAction,
  updateTaskOrderAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  createQuickLinkAction,
  updateQuickLinkAction,
  deleteQuickLinkAction,
}: MemberWorkspaceProjectDetailPageProps) {
  const canManageProject =
    canManageProjectProp ??
    Boolean(
      updateProjectAction ||
        createTaskAction ||
        createNoteAction ||
        createQuickLinkAction,
    )
  const router = useRouter()
  const [showMeta, setShowMeta] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false)
  const [taskCreateContext, setTaskCreateContext] = useState<
    CreateTaskContext | undefined
  >()
  const [pendingInlineTaskContext, setPendingInlineTaskContext] = useState<
    CreateTaskContext | undefined
  >()
  const [isSavingProject, startProjectSaveTransition] = useTransition()
  const initialProjectDraft = useMemo(
    () => buildMemberWorkspaceProjectDetailDraft(project),
    [project]
  )
  const [projectDraft, setProjectDraft] =
    useState<MemberWorkspaceProjectDetailDraft>(initialProjectDraft)

  const breadcrumbs = useMemo(
    () => [{ label: "Projects", href: "/projects" }, { label: project.name }],
    [project.name]
  )

  useEffect(() => {
    setProjectDraft(initialProjectDraft)
  }, [initialProjectDraft])

  const hasProjectChanges = useMemo(
    () =>
      !areMemberWorkspaceProjectDetailDraftsEqual(
        projectDraft,
        initialProjectDraft
      ),
    [projectDraft, initialProjectDraft]
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
    [project.id, project.name]
  )

  const workstreamOptionsByProjectId = useMemo(
    () => ({
      [project.id]: project.workstreams.map((workstream) => ({
        id: workstream.id,
        label: workstream.name,
      })),
    }),
    [project.id, project.workstreams]
  )

  const openTaskCreate = useCallback(
    (context?: CreateTaskContext) => {
      if (!canManageProject) {
        return
      }

      if (isEditing) {
        setActiveTab("tasks")
        setPendingInlineTaskContext({
          projectId: project.id,
          ...context,
        })
        return
      }

      setTaskCreateContext({
        projectId: project.id,
        ...context,
      })
      setIsTaskCreateOpen(true)
    },
    [canManageProject, isEditing, project.id]
  )

  const handleChangeProjectDraftField = useCallback(
    (field: keyof MemberWorkspaceProjectDetailDraft, value: string) => {
      setProjectDraft((currentDraft) => ({
        ...currentDraft,
        [field]: value,
      }))
    },
    []
  )

  const handleStartProjectEditing = useCallback(() => {
    if (!updateProjectAction) {
      return
    }

    setProjectDraft(initialProjectDraft)
    setIsEditing(true)
  }, [initialProjectDraft, updateProjectAction])

  const handleCancelProjectEditing = useCallback(() => {
    setProjectDraft(initialProjectDraft)
    setPendingInlineTaskContext(undefined)
    setIsEditing(false)
  }, [initialProjectDraft])

  const handleSaveProject = useCallback(() => {
    if (!updateProjectAction) {
      toast.error("Project editing is unavailable.")
      return
    }

    if (!hasProjectChanges) {
      setIsEditing(false)
      return
    }

    startProjectSaveTransition(async () => {
      const result = await updateProjectAction(
        project.id,
        buildMemberWorkspaceProjectUpdateInput({
          project,
          draft: projectDraft,
        })
      )

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success("Project updated")
      setIsEditing(false)
      router.refresh()
    })
  }, [hasProjectChanges, project, projectDraft, router, updateProjectAction])
  const {
    handleCreateAsset,
    handleUploadNoteAssets,
    handleUpdateAsset,
    handleDeleteAsset,
  } = useProjectAssetActions({
    canManageProject,
    projectId: project.id,
  })

  const handleTaskSubmit = useCallback(
    async (value: TaskQuickCreateSubmitValue) => {
      if (!createTaskAction) {
        return { error: "Task creation is unavailable." }
      }

      const tagLabel = TAG_OPTIONS.find(
        (option) => option.id === value.tagId
      )?.label
      const startDate =
        value.startDate?.toISOString().slice(0, 10) ??
        new Date().toISOString().slice(0, 10)
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
    [createTaskAction, router]
  )

  return (
    <div
      className={`${styles.surface} bg-background -mx-[var(--shell-content-pad)] -mt-[var(--shell-content-pad)] -mb-[var(--shell-content-pad)] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}
    >
      <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="text-muted-foreground hover:text-foreground size-8 rounded-lg"
          />
          <div className="hidden sm:block">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <ProjectDetailTopBarActions
          hasProjectChanges={hasProjectChanges}
          isEditing={isEditing}
          isSavingProject={isSavingProject}
          showMeta={showMeta}
          onCancelProjectEditing={handleCancelProjectEditing}
          onCopyLink={copyLink}
          onSaveProject={handleSaveProject}
          onToggleMeta={() => setShowMeta((value) => !value)}
        />
      </div>

      <div className="bg-background flex min-h-0 flex-1 flex-col">
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
                <div className="space-y-6 pt-4 pb-8">
                  <MemberWorkspaceProjectDetailHeader
                    project={project}
                    canEditProject={canManageProject && Boolean(updateProjectAction)}
                    isEditing={isEditing}
                    draft={projectDraft}
                    onChangeDraftField={handleChangeProjectDraftField}
                    onEditProject={handleStartProjectEditing}
                  />

                  <MemberWorkspaceProjectDetailTabs
                    activeTab={activeTab}
                    assigneeOptions={assigneeOptions}
                    createNoteAction={createNoteAction}
                    createTaskAction={createTaskAction}
                    currentUser={currentUser}
                    deleteNoteAction={deleteNoteAction}
                    deleteTaskAction={deleteTaskAction}
                    draft={projectDraft}
                    isEditing={isEditing}
                    onActiveTabChange={setActiveTab}
                    onChangeDraftField={handleChangeProjectDraftField}
                    onCreateAsset={canManageProject ? handleCreateAsset : undefined}
                    onCreateTask={canManageProject ? openTaskCreate : undefined}
                    onDeleteNoteAsset={canManageProject ? handleDeleteAsset : undefined}
                    onDeleteAsset={canManageProject ? handleDeleteAsset : undefined}
                    onPendingInlineTaskContextHandled={() =>
                      setPendingInlineTaskContext(undefined)
                    }
                    onUploadNoteAssets={
                      canManageProject ? handleUploadNoteAssets : undefined
                    }
                    onUpdateAsset={canManageProject ? handleUpdateAsset : undefined}
                    pendingInlineTaskContext={pendingInlineTaskContext}
                    project={project}
                    updateNoteAction={updateNoteAction}
                    updateTaskAction={updateTaskAction}
                    updateTaskOrderAction={updateTaskOrderAction}
                    updateTaskStatusAction={updateTaskStatusAction}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {showMeta ? (
                    <motion.div
                      key="meta-panel"
                      initial={{ x: 80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 80, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 26,
                      }}
                      className="lg:border-border pb-8 lg:border-l lg:pl-6"
                    >
                      <MemberWorkspaceProjectRightMetaPanel
                        project={project}
                        organizationSummary={organizationSummary}
                        createQuickLinkAction={
                          canManageProject ? createQuickLinkAction : undefined
                        }
                        updateQuickLinkAction={
                          canManageProject ? updateQuickLinkAction : undefined
                        }
                        deleteQuickLinkAction={
                          canManageProject ? deleteQuickLinkAction : undefined
                        }
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
