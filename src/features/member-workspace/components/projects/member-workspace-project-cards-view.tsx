"use client"

import { FolderOpen, Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { Empty } from "@/components/ui/empty"
import { MemberWorkspaceProjectCard } from "./member-workspace-project-card"

export function MemberWorkspaceProjectCardsView({
  onEditProject,
  projects,
  onCreateProject,
  scope,
  visibleProperties,
}: {
  onEditProject?: (project: PlatformAdminDashboardLabProject) => void
  projects: PlatformAdminDashboardLabProject[]
  onCreateProject?: () => void
  scope: "organization" | "platform-admin"
  visibleProperties?: Array<"title" | "status" | "assignee" | "dueDate">
}) {
  if (projects.length === 0) {
    return (
      <div className="p-4">
        <Empty
          icon={<FolderOpen className="h-6 w-6" aria-hidden />}
          title={scope === "platform-admin" ? "No organizations yet" : "No projects yet"}
          description={
            scope === "platform-admin"
              ? "Organizations will appear here once accounts are created on the platform."
              : "Projects will appear here once the active organization has work to track."
          }
          variant="subtle"
          actions={onCreateProject ? (
            <Button type="button" variant="outline" onClick={onCreateProject}>
              <Plus data-icon="inline-start" />
              Create new project
            </Button>
          ) : null}
        />
      </div>
    )
  }

  return (
    <div className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
          <MemberWorkspaceProjectCard
            key={project.id}
            project={project}
            onEditProject={onEditProject}
            visibleProperties={visibleProperties}
          />
          ))}
        {onCreateProject ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-[180px] rounded-2xl border border-dashed border-border/60 bg-background p-6 text-sm text-muted-foreground hover:border-border/80 hover:bg-background hover:text-foreground"
            onClick={onCreateProject}
          >
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <Plus className="h-5 w-5" />
              <span>Create new project</span>
            </div>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
