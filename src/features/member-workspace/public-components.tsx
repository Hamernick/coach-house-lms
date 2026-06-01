"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

export const MemberWorkspaceOrgSwitcher = dynamic<
  ComponentProps<
    typeof import("./components/shell/member-workspace-org-switcher").MemberWorkspaceOrgSwitcher
  >
>(() =>
  import("./components/shell/member-workspace-org-switcher").then(
    (mod) => mod.MemberWorkspaceOrgSwitcher,
  ),
)

export const MemberWorkspacePageLoading = dynamic<
  ComponentProps<
    typeof import("./components/shell/member-workspace-page-loading").MemberWorkspacePageLoading
  >
>(() =>
  import("./components/shell/member-workspace-page-loading").then(
    (mod) => mod.MemberWorkspacePageLoading,
  ),
)

export const MemberWorkspaceProjectDetailLoading = dynamic<
  ComponentProps<
    typeof import("./components/projects/member-workspace-project-detail-loading").MemberWorkspaceProjectDetailLoading
  >
>(() =>
  import("./components/projects/member-workspace-project-detail-loading").then(
    (mod) => mod.MemberWorkspaceProjectDetailLoading,
  ),
)

export const MemberWorkspaceProjectDetailPage = dynamic<
  ComponentProps<
    typeof import("./components/projects/member-workspace-project-detail-page").MemberWorkspaceProjectDetailPage
  >
>(() =>
  import("./components/projects/member-workspace-project-detail-page").then(
    (mod) => mod.MemberWorkspaceProjectDetailPage,
  ),
)

export const MemberWorkspacePeoplePage = dynamic<
  ComponentProps<
    typeof import("./components/people/member-workspace-people-page").MemberWorkspacePeoplePage
  >
>(() =>
  import("./components/people/member-workspace-people-page").then(
    (mod) => mod.MemberWorkspacePeoplePage,
  ),
)

export const MemberWorkspaceProjectsPage = dynamic<
  ComponentProps<
    typeof import("./components/projects/member-workspace-projects-page").MemberWorkspaceProjectsPage
  >
>(() =>
  import("./components/projects/member-workspace-projects-page").then(
    (mod) => mod.MemberWorkspaceProjectsPage,
  ),
)

export const MemberWorkspaceTasksPage = dynamic<
  ComponentProps<
    typeof import("./components/tasks/member-workspace-tasks-page").MemberWorkspaceTasksPage
  >
>(() =>
  import("./components/tasks/member-workspace-tasks-page").then(
    (mod) => mod.MemberWorkspaceTasksPage,
  ),
)
