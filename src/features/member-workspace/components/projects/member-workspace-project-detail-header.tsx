"use client"

import type { ReactNode } from "react"
import {
  ArrowsClockwise,
  Globe,
  PencilSimpleLine,
  Star,
  Timer,
  User,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Badge,
  MetaChipsRow,
  PriorityBadge,
  type ProjectDetails,
  type PriorityLevel,
} from "@/features/platform-admin-dashboard"
import { cn } from "@/lib/utils"
import {
  MEMBER_WORKSPACE_PROJECT_PRIORITY_OPTIONS,
  MEMBER_WORKSPACE_PROJECT_STATUS_OPTIONS,
  type MemberWorkspaceProjectDetailDraft,
} from "./member-workspace-project-detail-editing"

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

function formatStatusLabel(
  status: MemberWorkspaceProjectDetailDraft["status"]
) {
  switch (status) {
    case "active":
      return "Active"
    case "planned":
      return "Planned"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    default:
      return "Backlog"
  }
}

type MemberWorkspaceProjectDetailHeaderProps = {
  project: ProjectDetails
  canEditProject?: boolean
  isEditing?: boolean
  draft?: MemberWorkspaceProjectDetailDraft
  onChangeDraftField?: (
    field: keyof MemberWorkspaceProjectDetailDraft,
    value: string
  ) => void
  onEditProject?: () => void
}

function FieldShell({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>
}

export function MemberWorkspaceProjectDetailHeader({
  project,
  canEditProject = false,
  isEditing = false,
  draft,
  onChangeDraftField,
  onEditProject,
}: MemberWorkspaceProjectDetailHeaderProps) {
  const statusLabel =
    isEditing && draft
      ? formatStatusLabel(draft.status)
      : project.backlog.statusLabel
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
  ].filter(
    (item) => item.value !== undefined && item.value !== null && item.value !== ""
  )

  return (
    <section className="mt-4 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground text-2xl leading-tight font-semibold">
              {isEditing ? draft?.name || project.name : project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={statusBadgeClasses(statusLabel)}
              >
                <Star className="h-3 w-3" />
                {statusLabel}
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
              {isEditing ? (
                <Badge
                  variant="outline"
                  className="border-border/70 bg-background/80"
                >
                  Edit mode
                </Badge>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <p className="text-muted-foreground max-w-3xl text-sm leading-6">
              Update the project details inline. Fields collapse into a
              single-column form on smaller screens so the page stays usable on
              mobile.
            </p>
          ) : null}
        </div>

        {canEditProject && !isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Edit project"
            className="text-muted-foreground hover:text-foreground size-9 rounded-lg"
            onClick={onEditProject}
          >
            <PencilSimpleLine className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {isEditing && draft && onChangeDraftField ? (
        <div className="border-border/70 bg-card/80 rounded-2xl border p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FieldShell className="md:col-span-2 xl:col-span-3">
              <Label htmlFor="member-workspace-project-name">
                Project name
              </Label>
              <Input
                id="member-workspace-project-name"
                value={draft.name}
                onChange={(event) =>
                  onChangeDraftField("name", event.currentTarget.value)
                }
              />
            </FieldShell>

            <FieldShell>
              <Label htmlFor="member-workspace-project-status">Status</Label>
              <Select
                value={draft.status}
                onValueChange={(value) => onChangeDraftField("status", value)}
              >
                <SelectTrigger
                  id="member-workspace-project-status"
                  className="w-full"
                >
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_WORKSPACE_PROJECT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>

            <FieldShell>
              <Label htmlFor="member-workspace-project-priority">
                Priority
              </Label>
              <Select
                value={draft.priority}
                onValueChange={(value) => onChangeDraftField("priority", value)}
              >
                <SelectTrigger
                  id="member-workspace-project-priority"
                  className="w-full"
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_WORKSPACE_PROJECT_PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>

            <FieldShell>
              <Label htmlFor="member-workspace-project-client">Client</Label>
              <Input
                id="member-workspace-project-client"
                value={draft.clientName}
                placeholder="Add client or workspace name"
                onChange={(event) =>
                  onChangeDraftField("clientName", event.currentTarget.value)
                }
              />
            </FieldShell>

            <FieldShell>
              <Label htmlFor="member-workspace-project-start-date">
                Start date
              </Label>
              <Input
                id="member-workspace-project-start-date"
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  onChangeDraftField("startDate", event.currentTarget.value)
                }
              />
            </FieldShell>

            <FieldShell>
              <Label htmlFor="member-workspace-project-end-date">
                End date
              </Label>
              <Input
                id="member-workspace-project-end-date"
                type="date"
                value={draft.endDate}
                onChange={(event) =>
                  onChangeDraftField("endDate", event.currentTarget.value)
                }
              />
            </FieldShell>

            <FieldShell>
              <Label htmlFor="member-workspace-project-type">Sprint type</Label>
              <Input
                id="member-workspace-project-type"
                value={draft.typeLabel}
                placeholder="Design Sprint"
                onChange={(event) =>
                  onChangeDraftField("typeLabel", event.currentTarget.value)
                }
              />
            </FieldShell>

            <FieldShell>
              <Label htmlFor="member-workspace-project-track">
                Classification
              </Label>
              <Input
                id="member-workspace-project-track"
                value={draft.durationLabel}
                placeholder="Frontend"
                onChange={(event) =>
                  onChangeDraftField("durationLabel", event.currentTarget.value)
                }
              />
            </FieldShell>

            <FieldShell className="xl:col-span-1">
              <Label htmlFor="member-workspace-project-tags">Tags</Label>
              <Input
                id="member-workspace-project-tags"
                value={draft.tags}
                placeholder="design, launch, qa"
                onChange={(event) =>
                  onChangeDraftField("tags", event.currentTarget.value)
                }
              />
              <p className="text-muted-foreground text-xs leading-5">
                Comma-separated.
              </p>
            </FieldShell>

            <FieldShell className="md:col-span-2 xl:col-span-2">
              <Label htmlFor="member-workspace-project-members">
                Assigned members
              </Label>
              <Input
                id="member-workspace-project-members"
                value={draft.memberLabels}
                placeholder="Alex Rivera, Morgan Lee"
                onChange={(event) =>
                  onChangeDraftField("memberLabels", event.currentTarget.value)
                }
              />
              <p className="text-muted-foreground text-xs leading-5">
                Comma-separated names shown across the project view.
              </p>
            </FieldShell>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="border-border/70 bg-background/80 rounded-xl border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                Project ID
              </p>
              <p className="text-foreground mt-2 text-sm font-medium">
                #{project.id}
              </p>
            </div>
            <div className="border-border/70 bg-background/80 rounded-xl border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                Last sync
              </p>
              <p className="text-foreground mt-2 text-sm font-medium">
                {project.meta.lastSyncLabel}
              </p>
            </div>
            {project.meta.locationLabel ? (
              <div className="border-border/70 bg-background/80 rounded-xl border p-3 sm:col-span-2 xl:col-span-1">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                  Location
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {project.meta.locationLabel}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <MetaChipsRow items={metaItems} />
        </div>
      )}
    </section>
  )
}
