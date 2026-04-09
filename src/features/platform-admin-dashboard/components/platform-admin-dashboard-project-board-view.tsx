import { Badge } from "@/components/ui/badge"
import { PlatformAdminDashboardProjectCard } from "./platform-admin-dashboard-project-card"
import type {
  PlatformAdminDashboardLabProject,
  PlatformAdminDashboardLabStatus,
} from "../types"

type PlatformAdminDashboardProjectBoardViewProps = {
  groupedProjects: Record<PlatformAdminDashboardLabStatus, PlatformAdminDashboardLabProject[]>
}

const BOARD_COLUMNS: PlatformAdminDashboardLabStatus[] = [
  "backlog",
  "planned",
  "active",
  "completed",
]

export function PlatformAdminDashboardProjectBoardView({
  groupedProjects,
}: PlatformAdminDashboardProjectBoardViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      {BOARD_COLUMNS.map((status) => (
        <section
          key={status}
          className="space-y-3 rounded-3xl border border-border/70 bg-muted/30 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold capitalize text-foreground">
              {status}
            </h3>
            <Badge variant="secondary">{groupedProjects[status].length}</Badge>
          </div>
          <div className="space-y-3">
            {groupedProjects[status].map((project) => (
              <PlatformAdminDashboardProjectCard
                key={project.id}
                project={project}
                compact
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
