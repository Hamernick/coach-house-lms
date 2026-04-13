"use client"

import {
  AssetsFilesTab,
  KeyFeaturesColumns,
  NotesTab,
  OutcomesList,
  ProjectTasksTab,
  ScopeColumns,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TimelineGantt,
  WorkstreamTab,
  type CreateTaskContext,
  type UploadedNoteAsset,
  type ProjectDetails,
  type User,
} from "@/features/platform-admin-dashboard"
import type {
  MemberWorkspaceCreateProjectNoteInput,
  MemberWorkspaceCreateTaskInput,
  MemberWorkspacePersonOption,
  MemberWorkspaceUpdateProjectNoteInput,
} from "../../types"
import {
  type MemberWorkspaceProjectDetailDraft,
} from "./member-workspace-project-detail-editing"
import { MemberWorkspaceProjectOverviewEditor } from "./member-workspace-project-overview-editor"
import { MemberWorkspaceProjectTasksEditor } from "./member-workspace-project-tasks-editor"

function ProjectDetailTabsList() {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <TabsList className="inline-flex w-max min-w-full gap-2 px-1 sm:w-full sm:gap-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="workstream">Workstream</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="assets">Assets &amp; Files</TabsTrigger>
      </TabsList>
    </div>
  )
}

type ProjectDetailOverviewContentProps = {
  draft: MemberWorkspaceProjectDetailDraft
  isEditing: boolean
  project: ProjectDetails
  onChangeDraftField: (
    field: keyof MemberWorkspaceProjectDetailDraft,
    value: string
  ) => void
}

function ProjectDetailOverviewContent({
  draft,
  isEditing,
  project,
  onChangeDraftField,
}: ProjectDetailOverviewContentProps) {
  if (isEditing) {
    return (
      <div className="space-y-10">
        <MemberWorkspaceProjectOverviewEditor
          draft={draft}
          onChangeDraftField={onChangeDraftField}
        />
        <section className="space-y-3">
          <div>
            <h2 className="text-foreground text-base font-semibold">
              Timeline
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              Timeline stays task-driven for now. Edit dates in the project
              header or update individual tasks in the tasks tab.
            </p>
          </div>
          <TimelineGantt tasks={project.timelineTasks} />
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <p className="text-muted-foreground text-sm leading-6">
        {project.description}
      </p>
      <ScopeColumns scope={project.scope} />
      <OutcomesList outcomes={project.outcomes} />
      <KeyFeaturesColumns features={project.keyFeatures} />
      <TimelineGantt tasks={project.timelineTasks} />
    </div>
  )
}

type MemberWorkspaceProjectDetailTabsProps = {
  activeTab: string
  assigneeOptions: MemberWorkspacePersonOption[]
  createNoteAction?: (
    input: MemberWorkspaceCreateProjectNoteInput
  ) => Promise<{ ok: true; noteId: string } | { error: string }>
  createTaskAction?: (
    input: MemberWorkspaceCreateTaskInput
  ) => Promise<{ ok: true; taskId: string } | { error: string }>
  currentUser: User
  deleteNoteAction?: (input: {
    noteId: string
    projectId: string
  }) => Promise<{ ok: true } | { error: string }>
  deleteTaskAction?: (
    taskId: string
  ) => Promise<{ ok: true; taskId: string; projectId: string } | { error: string }>
  draft: MemberWorkspaceProjectDetailDraft
  isEditing: boolean
  onActiveTabChange: (value: string) => void
  onChangeDraftField: (
    field: keyof MemberWorkspaceProjectDetailDraft,
    value: string
  ) => void
  onCreateAsset?: (input: {
    title?: string
    description?: string
    link?: string
    files: File[]
  }) => Promise<void>
  onCreateTask?: (context?: CreateTaskContext) => void
  onDeleteNoteAsset?: (assetId: string) => Promise<void>
  onDeleteAsset?: (assetId: string) => Promise<void>
  onPendingInlineTaskContextHandled: () => void
  onUploadNoteAssets?: (input: {
    title?: string
    description?: string
    files: File[]
  }) => Promise<UploadedNoteAsset[]>
  onUpdateAsset?: (
    assetId: string,
    input: {
      title?: string
      description?: string
      link?: string
      files: File[]
    }
  ) => Promise<void>
  pendingInlineTaskContext?: CreateTaskContext
  project: ProjectDetails
  updateNoteAction?: (
    input: MemberWorkspaceUpdateProjectNoteInput
  ) => Promise<{ ok: true; noteId: string } | { error: string }>
  updateTaskAction?: (
    taskId: string,
    input: MemberWorkspaceCreateTaskInput
  ) => Promise<{ ok: true; taskId: string } | { error: string }>
  updateTaskOrderAction?: (
    projectId: string,
    orderedTaskIds: string[]
  ) => Promise<{ ok: true; projectId: string } | { error: string }>
  updateTaskStatusAction?: (
    taskId: string,
    nextStatus: "todo" | "in-progress" | "done"
  ) => Promise<
    | { ok: true; taskId: string; status: "todo" | "in-progress" | "done" }
    | { error: string }
  >
}

export function MemberWorkspaceProjectDetailTabs({
  activeTab,
  assigneeOptions,
  createNoteAction,
  createTaskAction,
  currentUser,
  deleteNoteAction,
  deleteTaskAction,
  draft,
  isEditing,
  onActiveTabChange,
  onChangeDraftField,
  onCreateAsset,
  onCreateTask,
  onDeleteNoteAsset,
  onDeleteAsset,
  onPendingInlineTaskContextHandled,
  onUploadNoteAssets,
  onUpdateAsset,
  pendingInlineTaskContext,
  project,
  updateNoteAction,
  updateTaskAction,
  updateTaskOrderAction,
  updateTaskStatusAction,
}: MemberWorkspaceProjectDetailTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onActiveTabChange}>
      <ProjectDetailTabsList />

      <TabsContent value="overview">
        <ProjectDetailOverviewContent
          draft={draft}
          isEditing={isEditing}
          project={project}
          onChangeDraftField={onChangeDraftField}
        />
      </TabsContent>

      <TabsContent value="workstream">
        <WorkstreamTab
          workstreams={project.workstreams}
          canReorder={false}
          canToggleTasks={Boolean(updateTaskStatusAction)}
          onCreateTask={onCreateTask}
        />
      </TabsContent>

      <TabsContent value="tasks">
        {isEditing ? (
          <MemberWorkspaceProjectTasksEditor
            project={project}
            assigneeOptions={assigneeOptions}
            createTaskAction={createTaskAction}
            updateTaskAction={updateTaskAction}
            deleteTaskAction={deleteTaskAction}
            updateTaskOrderAction={updateTaskOrderAction}
            pendingCreateContext={pendingInlineTaskContext}
            onPendingCreateContextHandled={onPendingInlineTaskContextHandled}
          />
        ) : (
          <ProjectTasksTab
            project={project}
            canReorder={false}
            onCreateTask={onCreateTask}
            onUpdateTaskStatus={updateTaskStatusAction}
            onReorderTasks={updateTaskOrderAction}
          />
        )}
      </TabsContent>

      <TabsContent value="notes">
        <NotesTab
          notes={project.notes || []}
          currentUser={currentUser}
          createNoteAction={createNoteAction}
          updateNoteAction={updateNoteAction}
          deleteNoteAction={deleteNoteAction}
          projectId={project.id}
          uploadNoteAssets={onUploadNoteAssets}
          deleteUploadedNoteAsset={onDeleteNoteAsset}
        />
      </TabsContent>

      <TabsContent value="assets">
        <AssetsFilesTab
          files={project.files}
          onCreateAsset={onCreateAsset}
          onUpdateAsset={onUpdateAsset}
          onDeleteAsset={onDeleteAsset}
        />
      </TabsContent>
    </Tabs>
  )
}
