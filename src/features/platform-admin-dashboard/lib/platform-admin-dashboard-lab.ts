import {
  activeProjects as upstreamActiveProjects,
  navItems as upstreamNavItems,
} from "./upstream/project-dashboard-sidebar"
import { projects as upstreamProjects } from "./upstream/project-dashboard-projects"
import type {
  PlatformAdminDashboardLabActiveProjectSummary,
  PlatformAdminDashboardLabFilters,
  PlatformAdminDashboardLabNavItem,
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabProject,
  PlatformAdminDashboardLabSection,
  PlatformAdminDashboardLabStatus,
  PlatformAdminDashboardLabViewType,
} from "../types"

export const PLATFORM_ADMIN_DASHBOARD_LAB_SOURCE_REPO_URL =
  "https://github.com/Jason-uxui/project-dashboard"
export const PLATFORM_ADMIN_DASHBOARD_LAB_SOURCE_COMMIT =
  "12f1ff4cdad06bc99fd1f18e1febea1719addf35"
export const PLATFORM_ADMIN_DASHBOARD_LAB_ROUTE = "/internal/platform-lab"

export const PLATFORM_ADMIN_DASHBOARD_LAB_SECTIONS = [
  "inbox",
  "my-tasks",
  "projects",
  "clients",
  "performance",
] as const satisfies readonly PlatformAdminDashboardLabSection[]

export const PLATFORM_ADMIN_DASHBOARD_LAB_VIEW_TYPES = [
  "list",
  "board",
  "timeline",
] as const satisfies readonly PlatformAdminDashboardLabViewType[]

export const PLATFORM_ADMIN_DASHBOARD_LAB_STATUSES = [
  "backlog",
  "planned",
  "active",
  "cancelled",
  "completed",
] as const satisfies readonly PlatformAdminDashboardLabStatus[]

export const PLATFORM_ADMIN_DASHBOARD_LAB_PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
] as const satisfies readonly PlatformAdminDashboardLabPriority[]

export const DEFAULT_PLATFORM_ADMIN_DASHBOARD_LAB_SECTION: PlatformAdminDashboardLabSection =
  "projects"
export const DEFAULT_PLATFORM_ADMIN_DASHBOARD_LAB_VIEW: PlatformAdminDashboardLabViewType = "list"

export const platformAdminDashboardLabNavItems =
  upstreamNavItems as PlatformAdminDashboardLabNavItem[]
export const platformAdminDashboardLabActiveProjects =
  upstreamActiveProjects as PlatformAdminDashboardLabActiveProjectSummary[]
export const platformAdminDashboardLabProjects =
  upstreamProjects as PlatformAdminDashboardLabProject[]

const SECTION_LABELS: Record<PlatformAdminDashboardLabSection, string> = {
  inbox: "Inbox",
  "my-tasks": "My tasks",
  projects: "Projects",
  clients: "Clients",
  performance: "Performance",
}

export function normalizePlatformAdminDashboardInput(
  input: PlatformAdminDashboardLabProject,
): PlatformAdminDashboardLabProject {
  return input
}

export function parsePlatformAdminDashboardLabSection(
  value: string | null | undefined,
): PlatformAdminDashboardLabSection {
  if (!value) return DEFAULT_PLATFORM_ADMIN_DASHBOARD_LAB_SECTION
  return PLATFORM_ADMIN_DASHBOARD_LAB_SECTIONS.includes(
    value as PlatformAdminDashboardLabSection,
  )
    ? (value as PlatformAdminDashboardLabSection)
    : DEFAULT_PLATFORM_ADMIN_DASHBOARD_LAB_SECTION
}

export function parsePlatformAdminDashboardLabViewType(
  value: string | null | undefined,
): PlatformAdminDashboardLabViewType {
  if (!value) return DEFAULT_PLATFORM_ADMIN_DASHBOARD_LAB_VIEW
  return PLATFORM_ADMIN_DASHBOARD_LAB_VIEW_TYPES.includes(
    value as PlatformAdminDashboardLabViewType,
  )
    ? (value as PlatformAdminDashboardLabViewType)
    : DEFAULT_PLATFORM_ADMIN_DASHBOARD_LAB_VIEW
}

export function parsePlatformAdminDashboardLabStatus(
  value: string | null | undefined,
): PlatformAdminDashboardLabStatus | null {
  if (!value) return null
  return PLATFORM_ADMIN_DASHBOARD_LAB_STATUSES.includes(
    value as PlatformAdminDashboardLabStatus,
  )
    ? (value as PlatformAdminDashboardLabStatus)
    : null
}

export function parsePlatformAdminDashboardLabPriority(
  value: string | null | undefined,
): PlatformAdminDashboardLabPriority | null {
  if (!value) return null
  return PLATFORM_ADMIN_DASHBOARD_LAB_PRIORITIES.includes(
    value as PlatformAdminDashboardLabPriority,
  )
    ? (value as PlatformAdminDashboardLabPriority)
    : null
}

export function getPlatformAdminDashboardLabSectionLabel(
  section: PlatformAdminDashboardLabSection,
): string {
  return SECTION_LABELS[section]
}

export function buildPlatformAdminDashboardLabSearchDocument(
  input: PlatformAdminDashboardLabProject,
): string {
  return [
    input.name,
    input.client ?? "",
    input.typeLabel ?? "",
    input.durationLabel ?? "",
    input.status,
    input.priority,
    ...input.tags,
    ...input.members,
    ...input.tasks.map((task) => task.name),
  ]
    .join(" ")
    .toLowerCase()
}

export function filterPlatformAdminDashboardLabProjects(
  projects: PlatformAdminDashboardLabProject[],
  filters: PlatformAdminDashboardLabFilters,
): PlatformAdminDashboardLabProject[] {
  const query = filters.query.trim().toLowerCase()

  return projects.filter((project) => {
    if (filters.status && project.status !== filters.status) return false
    if (filters.priority && project.priority !== filters.priority) return false
    if (!query) return true
    return buildPlatformAdminDashboardLabSearchDocument(project).includes(query)
  })
}

export function groupPlatformAdminDashboardLabProjectsByStatus(
  projects: PlatformAdminDashboardLabProject[],
): Record<PlatformAdminDashboardLabStatus, PlatformAdminDashboardLabProject[]> {
  return {
    backlog: projects.filter((project) => project.status === "backlog"),
    planned: projects.filter((project) => project.status === "planned"),
    active: projects.filter((project) => project.status === "active"),
    cancelled: projects.filter((project) => project.status === "cancelled"),
    completed: projects.filter((project) => project.status === "completed"),
  }
}

export function summarizePlatformAdminDashboardLabProjects(
  projects: PlatformAdminDashboardLabProject[],
): Array<{ label: string; value: string; tone?: "default" | "accent" }> {
  const active = projects.filter((project) => project.status === "active").length
  const urgent = projects.filter((project) => project.priority === "urgent").length
  const completed = projects.filter(
    (project) => project.status === "completed",
  ).length

  return [
    { label: "Projects", value: String(projects.length) },
    { label: "Active", value: String(active), tone: "accent" },
    { label: "Urgent", value: String(urgent) },
    { label: "Completed", value: String(completed) },
  ]
}
