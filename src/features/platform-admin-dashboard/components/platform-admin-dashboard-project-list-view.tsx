import { PlatformAdminDashboardProjectCard } from "./platform-admin-dashboard-project-card"
import type { PlatformAdminDashboardLabProject } from "../types"

type PlatformAdminDashboardProjectListViewProps = {
  projects: PlatformAdminDashboardLabProject[]
}

export function PlatformAdminDashboardProjectListView({
  projects,
}: PlatformAdminDashboardProjectListViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <PlatformAdminDashboardProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
