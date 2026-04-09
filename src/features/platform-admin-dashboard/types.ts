export type PlatformAdminDashboardLabSection =
  | "inbox"
  | "my-tasks"
  | "projects"
  | "clients"
  | "performance"

export type PlatformAdminDashboardLabViewType = "list" | "board" | "timeline"

export type PlatformAdminDashboardLabStatus =
  | "backlog"
  | "planned"
  | "active"
  | "cancelled"
  | "completed"

export type PlatformAdminDashboardLabPriority = "urgent" | "high" | "medium" | "low"

export type PlatformAdminDashboardLabTaskStatus = "todo" | "in-progress" | "done"

export type PlatformAdminDashboardLabTask = {
  id: string
  name: string
  type: "bug" | "improvement" | "task"
  assignee: string
  status: PlatformAdminDashboardLabTaskStatus
  startDate: Date
  endDate: Date
}

export type PlatformAdminDashboardLabProject = {
  id: string
  organizationId?: string
  name: string
  description?: string
  taskCount: number
  progress: number
  startDate: Date
  endDate: Date
  status: PlatformAdminDashboardLabStatus
  priority: PlatformAdminDashboardLabPriority
  tags: string[]
  members: string[]
  client?: string
  typeLabel?: string
  durationLabel?: string
  tasks: PlatformAdminDashboardLabTask[]
}

export type PlatformAdminDashboardLabNavItem = {
  id: PlatformAdminDashboardLabSection
  label: string
  badge?: number
}

export type PlatformAdminDashboardLabActiveProjectSummary = {
  id: string
  name: string
  color: string
  progress: number
}

export type PlatformAdminDashboardLabSessionUser = {
  name: string | null
  email: string | null
  avatar: string | null
}

export type PlatformAdminDashboardLabState = {
  user: PlatformAdminDashboardLabSessionUser
  navItems: PlatformAdminDashboardLabNavItem[]
  activeProjects: PlatformAdminDashboardLabActiveProjectSummary[]
  projects: PlatformAdminDashboardLabProject[]
  sourceCommit: string
  sourceRepoUrl: string
}

export type PlatformAdminDashboardLabFilters = {
  query: string
  status: PlatformAdminDashboardLabStatus | null
  priority: PlatformAdminDashboardLabPriority | null
}
