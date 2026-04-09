"use client"

import { startTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  filterPlatformAdminDashboardLabProjects,
  getPlatformAdminDashboardLabSectionLabel,
  groupPlatformAdminDashboardLabProjectsByStatus,
  parsePlatformAdminDashboardLabPriority,
  parsePlatformAdminDashboardLabSection,
  parsePlatformAdminDashboardLabStatus,
  parsePlatformAdminDashboardLabViewType,
  summarizePlatformAdminDashboardLabProjects,
} from "../lib/platform-admin-dashboard-lab"
import type {
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabSection,
  PlatformAdminDashboardLabState,
  PlatformAdminDashboardLabStatus,
  PlatformAdminDashboardLabViewType,
} from "../types"

type PlatformAdminDashboardControllerState = {
  sourceCommitShort: string
  section: PlatformAdminDashboardLabSection
  sectionLabel: string
  viewType: PlatformAdminDashboardLabViewType
  query: string
  status: PlatformAdminDashboardLabStatus | null
  priority: PlatformAdminDashboardLabPriority | null
  filteredProjects: PlatformAdminDashboardLabState["projects"]
  groupedProjects: ReturnType<typeof groupPlatformAdminDashboardLabProjectsByStatus>
  summaries: ReturnType<typeof summarizePlatformAdminDashboardLabProjects>
}

function removeEmptyParam(params: URLSearchParams, key: string, value: string | null) {
  if (!value) {
    params.delete(key)
    return
  }
  params.set(key, value)
}

export function usePlatformAdminDashboardController(initialState: PlatformAdminDashboardLabState) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const section = parsePlatformAdminDashboardLabSection(searchParams.get("section"))
  const viewType = parsePlatformAdminDashboardLabViewType(searchParams.get("view"))
  const query = searchParams.get("q") ?? ""
  const status = parsePlatformAdminDashboardLabStatus(searchParams.get("status"))
  const priority = parsePlatformAdminDashboardLabPriority(searchParams.get("priority"))

  const filteredProjects = filterPlatformAdminDashboardLabProjects(initialState.projects, {
    query,
    status,
    priority,
  })
  const groupedProjects = groupPlatformAdminDashboardLabProjectsByStatus(filteredProjects)
  const summaries = summarizePlatformAdminDashboardLabProjects(filteredProjects)

  function buildHref(next: {
    section?: PlatformAdminDashboardLabSection
    view?: PlatformAdminDashboardLabViewType
    query?: string
    status?: PlatformAdminDashboardLabStatus | null
    priority?: PlatformAdminDashboardLabPriority | null
  }) {
    const params = new URLSearchParams(searchParams.toString())

    removeEmptyParam(params, "section", next.section ?? section)
    removeEmptyParam(params, "view", next.view ?? viewType)
    removeEmptyParam(params, "q", next.query ?? query)
    removeEmptyParam(params, "status", next.status ?? status)
    removeEmptyParam(params, "priority", next.priority ?? priority)

    const search = params.toString()
    return search.length > 0 ? `${pathname}?${search}` : pathname
  }

  function replaceSearch(next: Parameters<typeof buildHref>[0]) {
    startTransition(() => {
      router.replace(buildHref(next), { scroll: false })
    })
  }

  const state: PlatformAdminDashboardControllerState = {
    sourceCommitShort: initialState.sourceCommit.slice(0, 7),
    section,
    sectionLabel: getPlatformAdminDashboardLabSectionLabel(section),
    viewType,
    query,
    status,
    priority,
    filteredProjects,
    groupedProjects,
    summaries,
  }

  return {
    state,
    user: initialState.user,
    navItems: initialState.navItems,
    activeProjects: initialState.activeProjects,
    sourceRepoUrl: initialState.sourceRepoUrl,
    buildHref,
    replaceSearch,
  }
}
