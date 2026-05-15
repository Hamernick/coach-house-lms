import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"

const baseDate = new Date(2026, 0, 12)
const dateFromBase = (offsetDays: number) =>
  new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + offsetDays,
  )

export const memberWorkspaceStarterProjects: PlatformAdminDashboardLabProject[] = [
  {
    id: "1",
    name: "Projects preview",
    description:
      "A short sample project that shows how Coach House projects, tasks, and timelines work.",
    taskCount: 3,
    progress: 20,
    startDate: dateFromBase(0),
    endDate: dateFromBase(14),
    status: "planned",
    priority: "medium",
    tags: ["preview", "getting-started"],
    members: ["Workspace owner"],
    client: "Organization",
    typeLabel: "Preview",
    durationLabel: "2 weeks",
    tasks: [
      {
        id: "1-1",
        name: "Review the sample project",
        type: "task",
        assignee: "Owner",
        status: "done",
        startDate: dateFromBase(0),
        endDate: dateFromBase(2),
      },
      {
        id: "1-2",
        name: "Try adding a real project",
        type: "task",
        assignee: "Owner",
        status: "in-progress",
        startDate: dateFromBase(3),
        endDate: dateFromBase(7),
      },
      {
        id: "1-3",
        name: "Clear this preview when ready",
        type: "task",
        assignee: "Owner",
        status: "todo",
        startDate: dateFromBase(8),
        endDate: dateFromBase(14),
      },
    ],
  },
]
