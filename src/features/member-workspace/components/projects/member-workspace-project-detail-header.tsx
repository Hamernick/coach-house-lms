"use client"

import { ArrowsClockwise, Globe, Timer } from "@phosphor-icons/react/dist/ssr"
import { Star, User } from "@phosphor-icons/react/dist/ssr"

import {
  Badge,
  MetaChipsRow,
  PriorityBadge,
  type ProjectDetails,
  type PriorityLevel,
} from "@/features/platform-admin-dashboard"

function statusBadgeClasses(status: string) {
  switch (status) {
    case "Active":
      return "bg-blue-100 text-blue-700 border-none dark:bg-blue-500/15 dark:text-blue-50"
    case "Planned":
      return "bg-zinc-100 text-zinc-800 border-none dark:bg-zinc-600/20 dark:text-zinc-50"
    case "Backlog":
      return "bg-orange-100 text-orange-700 border-none dark:bg-orange-500/15 dark:text-orange-100"
    case "Completed":
      return "bg-emerald-100 text-emerald-700 border-none dark:bg-emerald-500/15 dark:text-emerald-100"
    case "Cancelled":
      return "bg-rose-100 text-rose-700 border-none dark:bg-rose-500/15 dark:text-rose-100"
    default:
      return "bg-muted text-muted-foreground border-none"
  }
}

type MemberWorkspaceProjectDetailHeaderProps = {
  project: ProjectDetails
}

export function MemberWorkspaceProjectDetailHeader({
  project,
}: MemberWorkspaceProjectDetailHeaderProps) {
  const metaItems = [
    { label: "ID", value: `#${project.id}`, icon: null },
    {
      label: "",
      value: (
        <PriorityBadge
          level={project.meta.priorityLabel.toLowerCase() as PriorityLevel}
          appearance="inline"
          size="sm"
        />
      ),
      icon: null,
    },
    {
      label: "",
      value: project.meta.locationLabel,
      icon: <Globe className="h-4 w-4" />,
    },
    {
      label: "Sprints",
      value: project.meta.sprintLabel,
      icon: <Timer className="h-4 w-4" />,
    },
    {
      label: "Last sync",
      value: project.meta.lastSyncLabel,
      icon: <ArrowsClockwise className="h-4 w-4" />,
    },
  ]

  return (
    <section className="mt-4 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold leading-tight text-foreground">
            {project.name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={statusBadgeClasses(project.backlog.statusLabel)}
            >
              <Star className="h-3 w-3" />
              {project.backlog.statusLabel}
            </Badge>
            {project.backlog.picUsers.length > 0 ? (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-none bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-100"
              >
                <User className="h-3 w-3" />
                Assigned
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <MetaChipsRow items={metaItems} />
      </div>
    </section>
  )
}
