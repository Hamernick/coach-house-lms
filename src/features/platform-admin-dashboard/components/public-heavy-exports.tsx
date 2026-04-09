"use client"

import type { ComponentProps } from "react"
import dynamic from "next/dynamic"

type AssetsFilesTabProps = ComponentProps<
  typeof import("../upstream/components/projects/AssetsFilesTab")["AssetsFilesTab"]
>
type NotesTabProps = ComponentProps<
  typeof import("../upstream/components/projects/NotesTab")["NotesTab"]
>
type ProjectTasksTabProps = ComponentProps<
  typeof import("../upstream/components/projects/ProjectTasksTab")["ProjectTasksTab"]
>
type ProjectWizardProps = ComponentProps<
  typeof import("../upstream/components/project-wizard/ProjectWizard")["ProjectWizard"]
>
type QuickLinksCardProps = ComponentProps<
  typeof import("../upstream/components/projects/QuickLinksCard")["QuickLinksCard"]
>
type TaskQuickCreateModalProps = ComponentProps<
  typeof import("../upstream/components/tasks/TaskQuickCreateModal")["TaskQuickCreateModal"]
>
type TimelineGanttProps = ComponentProps<
  typeof import("../upstream/components/projects/TimelineGantt")["TimelineGantt"]
>
type WorkstreamTabProps = ComponentProps<
  typeof import("../upstream/components/projects/WorkstreamTab")["WorkstreamTab"]
>

const AssetsFilesTabLazy = dynamic<AssetsFilesTabProps>(
  () => import("../upstream/components/projects/AssetsFilesTab").then((mod) => mod.AssetsFilesTab),
  { loading: () => null, ssr: false },
)

const NotesTabLazy = dynamic<NotesTabProps>(
  () => import("../upstream/components/projects/NotesTab").then((mod) => mod.NotesTab),
  { loading: () => null, ssr: false },
)

const ProjectTasksTabLazy = dynamic<ProjectTasksTabProps>(
  () => import("../upstream/components/projects/ProjectTasksTab").then((mod) => mod.ProjectTasksTab),
  { loading: () => null, ssr: false },
)

const ProjectWizardLazy = dynamic<ProjectWizardProps>(
  () => import("../upstream/components/project-wizard/ProjectWizard").then((mod) => mod.ProjectWizard),
  { loading: () => null, ssr: false },
)

const QuickLinksCardLazy = dynamic<QuickLinksCardProps>(
  () => import("../upstream/components/projects/QuickLinksCard").then((mod) => mod.QuickLinksCard),
  { loading: () => null, ssr: false },
)

const TaskQuickCreateModalLazy = dynamic<TaskQuickCreateModalProps>(
  () =>
    import("../upstream/components/tasks/TaskQuickCreateModal").then(
      (mod) => mod.TaskQuickCreateModal,
    ),
  { loading: () => null, ssr: false },
)

const TimelineGanttLazy = dynamic<TimelineGanttProps>(
  () => import("../upstream/components/projects/TimelineGantt").then((mod) => mod.TimelineGantt),
  { loading: () => null, ssr: false },
)

const WorkstreamTabLazy = dynamic<WorkstreamTabProps>(
  () => import("../upstream/components/projects/WorkstreamTab").then((mod) => mod.WorkstreamTab),
  { loading: () => null, ssr: false },
)

export function AssetsFilesTab(props: AssetsFilesTabProps) {
  return <AssetsFilesTabLazy {...props} />
}

export function NotesTab(props: NotesTabProps) {
  return <NotesTabLazy {...props} />
}

export function ProjectTasksTab(props: ProjectTasksTabProps) {
  return <ProjectTasksTabLazy {...props} />
}

export function ProjectWizard(props: ProjectWizardProps) {
  return <ProjectWizardLazy {...props} />
}

export function QuickLinksCard(props: QuickLinksCardProps) {
  return <QuickLinksCardLazy {...props} />
}

export function TaskQuickCreateModal(props: TaskQuickCreateModalProps) {
  return <TaskQuickCreateModalLazy {...props} />
}

export function TimelineGantt(props: TimelineGanttProps) {
  return <TimelineGanttLazy {...props} />
}

export function WorkstreamTab(props: WorkstreamTabProps) {
  return <WorkstreamTabLazy {...props} />
}
