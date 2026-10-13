import { format } from "date-fns"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"
import CircleAlertIcon from "lucide-react/dist/esm/icons/circle-alert"
import FolderIcon from "lucide-react/dist/esm/icons/folder"
import UserIcon from "lucide-react/dist/esm/icons/user"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { PlatformAdminDashboardLabProject } from "../types"

type PlatformAdminDashboardProjectCardProps = {
  project: PlatformAdminDashboardLabProject
  compact?: boolean
}

function getStatusBadgeVariant(project: PlatformAdminDashboardLabProject) {
  switch (project.status) {
    case "active":
      return "default"
    case "planned":
      return "secondary"
    case "completed":
      return "outline"
    case "backlog":
      return "outline"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

export function PlatformAdminDashboardProjectCard({
  project,
  compact = false,
}: PlatformAdminDashboardProjectCardProps) {
  const primaryAssignee = project.members[0] ?? null
  const initials = primaryAssignee
    ? primaryAssignee
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "CH"

  return (
    <Card className="border-border/70 bg-background/95 shadow-sm">
      <CardContent className={compact ? "space-y-3 p-4" : "space-y-4 p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FolderIcon className="h-3.5 w-3.5" aria-hidden />
              <span>{project.client ?? "Internal lab client"}</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold leading-6 text-foreground">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {[project.typeLabel, project.durationLabel]
                  .filter(Boolean)
                  .join(" • ") || "Imported donor project sample"}
              </p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(project)}>
            {project.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {project.priority}
          </Badge>
          {project.tags.slice(0, compact ? 1 : 2).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden />
            <span>{format(project.endDate, "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleAlertIcon className="h-3.5 w-3.5" aria-hidden />
            <span>{project.taskCount} tasks</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-7 w-7 border border-border/70">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate">
              {primaryAssignee ?? "Unassigned"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserIcon className="h-3.5 w-3.5" aria-hidden />
            <span>{project.members.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
