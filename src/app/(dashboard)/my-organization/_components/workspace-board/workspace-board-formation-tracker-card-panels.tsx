"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import Link from "next/link"
import ArchiveRestoreIcon from "lucide-react/dist/esm/icons/archive-restore"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CircleDotIcon from "lucide-react/dist/esm/icons/circle-dot"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  resolveNextTicketStatus,
  resolveTicketMarkerClassName,
  resolveTicketStatusLabel,
  TrackerRowAction,
  TrackerSectionHeader,
} from "./workspace-board-formation-tracker-card-ui"
import type {
  WorkspaceSeedData,
  WorkspaceMemberOption,
  WorkspaceTrackerCategory,
  WorkspaceTrackerState,
  WorkspaceTrackerTicket,
  WorkspaceTrackerTicketPriority,
  WorkspaceTrackerTicketStatus,
} from "./workspace-board-types"

export const VISIBLE_CATEGORY_TICKETS = 4

export type AcceleratorGroup = {
  id: string
  title: string
  modules: WorkspaceSeedData["formationSummary"]["visibleModules"]
}

export function TrackerAcceleratorTab({
  presentationMode,
  tracker,
  collapsedSections,
  groups,
  maxVisibleModulesPerGroup,
  onToggleSection,
  onToggleGroupArchive,
}: {
  presentationMode: boolean
  tracker: WorkspaceTrackerState
  collapsedSections: Record<string, boolean>
  groups: AcceleratorGroup[]
  maxVisibleModulesPerGroup: number
  onToggleSection: (sectionId: string) => void
  onToggleGroupArchive: (groupId: string) => void
}) {
  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Accelerator modules will appear as soon as your roadmap is available.
      </p>
    )
  }

  return (
    <div className="space-y-1.5 pb-1">
      {groups.map((group) => {
        const sectionId = `accelerator-${group.id}`
        const isCollapsed = collapsedSections[sectionId] === true
        const isArchived = tracker.archivedAcceleratorGroups.includes(group.id)
        const openModules = group.modules.filter((module) => module.status !== "completed")
        const visibleModules = openModules.slice(0, maxVisibleModulesPerGroup)
        const hiddenCount = Math.max(0, openModules.length - visibleModules.length)

        return (
          <div key={group.id} className="rounded-lg border border-border/60 bg-background/50 px-2 py-1.5">
                  <TrackerSectionHeader
                    collapsed={isCollapsed}
                    title={group.title}
                    count={openModules.length}
                    onToggle={() => onToggleSection(sectionId)}
                    actionLabel={isArchived ? `Restore ${group.title}` : `Archive ${group.title}`}
                    onAction={() => onToggleGroupArchive(group.id)}
                    actionIcon={isArchived ? "restore" : "archive"}
                  />

            {!isCollapsed ? (
              <div className={cn("space-y-1 border-t border-border/50 pt-1.5", isArchived && "opacity-55")}>
                {isArchived ? (
                  <p className="px-0.5 text-[11px] text-muted-foreground">
                    Archived. Restore to surface this track.
                  </p>
                ) : openModules.length === 0 ? (
                  <p className="px-0.5 text-[11px] text-muted-foreground">
                    All modules complete.
                  </p>
                ) : (
                  <>
                    {visibleModules.map((module) => {
                      const markerClassName = cn(
                        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold tabular-nums",
                        module.status === "completed"
                          ? "border-foreground bg-foreground text-background"
                          : module.status === "in_progress"
                            ? "border-foreground text-foreground"
                            : "border-border/70 text-foreground/75",
                      )

                      const moduleRow = (
                        <>
                          <span className={markerClassName} aria-hidden>
                            {module.status === "completed" ? (
                              <CheckIcon className="h-2.5 w-2.5" aria-hidden />
                            ) : module.status === "in_progress" ? (
                              <CircleDotIcon className="h-2.5 w-2.5" aria-hidden />
                            ) : (
                              module.index
                            )}
                          </span>
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-xs",
                              module.status === "completed" && "text-muted-foreground line-through decoration-2",
                            )}
                            >
                              {module.title}
                            </span>
                            <TrackerRowAction
                              status={module.status}
                              label={`Open ${module.title}`}
                            />
                        </>
                      )

                      return presentationMode ? (
                        <div key={module.id} className="flex items-center gap-2 rounded-md px-0.5 py-1">
                          {moduleRow}
                        </div>
                      ) : (
                        <Link
                          key={module.id}
                          href={module.href}
                          className="flex items-center gap-2 rounded-md px-0.5 py-1 transition-colors hover:bg-muted/20"
                        >
                          {moduleRow}
                        </Link>
                      )
                    })}
                    {hiddenCount > 0 ? (
                      <p className="px-0.5 text-[11px] text-muted-foreground tabular-nums">
                        +{hiddenCount} more modules
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function toInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts.at(-1)!.slice(0, 1)}`.toUpperCase()
}

function formatDueLabel(dueAt: string | null) {
  if (!dueAt) return null
  const parsed = new Date(dueAt)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed)
}

function resolvePriorityLabel(priority: WorkspaceTrackerTicketPriority) {
  if (priority === "critical") return "Critical"
  if (priority === "high") return "High"
  if (priority === "low") return "Low"
  return "Normal"
}

function resolvePriorityClassName(priority: WorkspaceTrackerTicketPriority) {
  if (priority === "critical") return "border-red-500/40 text-red-600 dark:text-red-300"
  if (priority === "high") return "border-amber-500/40 text-amber-700 dark:text-amber-300"
  if (priority === "low") return "border-emerald-500/35 text-emerald-700 dark:text-emerald-300"
  return "border-border/70 text-muted-foreground"
}

function TrackerTicketRow({
  ticket,
  memberById,
  presentationMode,
  onToggleTicketStatus,
  onEditTicket,
}: {
  ticket: WorkspaceTrackerTicket
  memberById: Map<string, WorkspaceMemberOption>
  presentationMode: boolean
  onToggleTicketStatus: (ticketId: string) => void
  onEditTicket: (ticketId: string) => void
}) {
  return (
    <div className="space-y-1 rounded-md border border-border/50 bg-background/40 px-2 py-1.5">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
            resolveTicketMarkerClassName(ticket.status),
          )}
          aria-hidden
        >
          {ticket.status === "done" ? <CheckIcon className="h-2.5 w-2.5" aria-hidden /> : null}
          {ticket.status === "in_progress" ? (
            <CircleDotIcon className="h-2.5 w-2.5" aria-hidden />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "line-clamp-2 text-xs font-medium leading-tight",
              ticket.status === "done" && "text-muted-foreground line-through decoration-2",
            )}
          >
            {ticket.title}
          </p>
          {ticket.description ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
              {ticket.description}
            </p>
          ) : null}
        </div>
        <TrackerRowAction
          status={ticket.status}
          onClick={() => onToggleTicketStatus(ticket.id)}
          disabled={presentationMode}
          label={`Set ${ticket.title} to ${resolveTicketStatusLabel(resolveNextTicketStatus(ticket.status))}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 rounded-full"
          onClick={() => onEditTicket(ticket.id)}
          disabled={presentationMode}
          aria-label={`Edit ${ticket.title}`}
        >
          <PencilIcon className="h-3 w-3" aria-hidden />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px]", resolvePriorityClassName(ticket.priority))}>
          {resolvePriorityLabel(ticket.priority)}
        </span>
        {formatDueLabel(ticket.dueAt) ? (
          <span className="rounded-full border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Due {formatDueLabel(ticket.dueAt)}
          </span>
        ) : null}

        {ticket.assigneeUserIds.length > 0 ? (
          <div className="ml-auto flex items-center gap-1">
            {ticket.assigneeUserIds.slice(0, 2).map((userId) => {
              const member = memberById.get(userId)
              const name = member?.name?.trim() || member?.email || "Member"
              return (
                <Avatar key={`${ticket.id}-${userId}`} className="h-5 w-5 border border-border/60">
                  {member?.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={name} /> : null}
                  <AvatarFallback className="text-[9px]">{toInitials(name)}</AvatarFallback>
                </Avatar>
              )
            })}
            {ticket.assigneeUserIds.length > 2 ? (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                +{ticket.assigneeUserIds.length - 2}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function TrackerTicketsTab({
  presentationMode,
  members,
  activeCategories,
  archivedCategories,
  collapsedSections,
  ticketQuery,
  onTicketQueryChange,
  ticketStatusFilter,
  onTicketStatusFilterChange,
  draftCategoryTitle,
  onDraftCategoryTitleChange,
  draftTicketTitle,
  onDraftTicketTitleChange,
  draftTicketDescription,
  onDraftTicketDescriptionChange,
  draftTicketPriority,
  onDraftTicketPriorityChange,
  draftTicketDueDate,
  onDraftTicketDueDateChange,
  draftTicketAssigneeId,
  onDraftTicketAssigneeIdChange,
  draftTicketCategoryId,
  onDraftTicketCategoryIdChange,
  ticketsByCategory,
  openTicketCount,
  doneTicketCount,
  onToggleSection,
  onToggleCategoryArchive,
  onToggleTicketStatus,
  onEditTicket,
  onCreateCategory,
  onCreateTicket,
}: {
  presentationMode: boolean
  members: WorkspaceMemberOption[]
  activeCategories: WorkspaceTrackerCategory[]
  archivedCategories: WorkspaceTrackerCategory[]
  collapsedSections: Record<string, boolean>
  ticketQuery: string
  onTicketQueryChange: (next: string) => void
  ticketStatusFilter: "all" | "open" | "done"
  onTicketStatusFilterChange: (next: "all" | "open" | "done") => void
  draftCategoryTitle: string
  onDraftCategoryTitleChange: (next: string) => void
  draftTicketTitle: string
  onDraftTicketTitleChange: (next: string) => void
  draftTicketDescription: string
  onDraftTicketDescriptionChange: (next: string) => void
  draftTicketPriority: WorkspaceTrackerTicketPriority
  onDraftTicketPriorityChange: (next: WorkspaceTrackerTicketPriority) => void
  draftTicketDueDate: string
  onDraftTicketDueDateChange: (next: string) => void
  draftTicketAssigneeId: string
  onDraftTicketAssigneeIdChange: (next: string) => void
  draftTicketCategoryId: string
  onDraftTicketCategoryIdChange: (next: string) => void
  ticketsByCategory: Map<string, WorkspaceTrackerTicket[]>
  openTicketCount: number
  doneTicketCount: number
  onToggleSection: (sectionId: string) => void
  onToggleCategoryArchive: (categoryId: string) => void
  onToggleTicketStatus: (ticketId: string) => void
  onEditTicket: (ticketId: string) => void
  onCreateCategory: () => void
  onCreateTicket: () => void
}) {
  const memberById = new Map(members.map((member) => [member.userId, member]))
  const normalizedQuery = ticketQuery.trim().toLowerCase()

  const matchesFilters = (ticket: WorkspaceTrackerTicket) => {
    if (ticketStatusFilter === "open" && ticket.status === "done") return false
    if (ticketStatusFilter === "done" && ticket.status !== "done") return false
    if (!normalizedQuery) return true
    const haystack = `${ticket.title} ${ticket.description ?? ""}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  }

  return (
    <div className="space-y-2 pb-1">
      <div className="flex items-center justify-between px-0.5 text-[11px] text-muted-foreground">
        <span className="tabular-nums">{openTicketCount} open objectives</span>
        <span className="tabular-nums">{doneTicketCount} done objectives</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-1.5">
        <Input
          value={ticketQuery}
          onChange={(event) => onTicketQueryChange(event.target.value)}
          placeholder="Search objectives"
          className="h-8 text-xs"
          aria-label="Search objectives"
        />
        <Select value={ticketStatusFilter} onValueChange={(next) => onTicketStatusFilterChange(next as "all" | "open" | "done")}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            <SelectItem value="open" className="text-xs">Open</SelectItem>
            <SelectItem value="done" className="text-xs">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeCategories.length > 0 ? (
        <div className="space-y-1.5">
          {activeCategories.map((category) => {
            const sectionId = `category-${category.id}`
            const isCollapsed = collapsedSections[sectionId] === true
            const allCategoryTickets = (ticketsByCategory.get(category.id) ?? []).filter(matchesFilters)
            const tickets = allCategoryTickets.slice(0, VISIBLE_CATEGORY_TICKETS)
            const hiddenCount = Math.max(0, allCategoryTickets.length - tickets.length)

            return (
              <CollapsiblePrimitive.Root key={category.id} open={!isCollapsed}>
                <div className="rounded-lg border border-border/60 bg-background/50 px-2 py-1.5">
                  <TrackerSectionHeader
                    collapsed={isCollapsed}
                    title={category.title}
                    count={allCategoryTickets.length}
                    onToggle={() => onToggleSection(sectionId)}
                    actionLabel={`Archive ${category.title}`}
                    onAction={() => onToggleCategoryArchive(category.id)}
                    actionIcon="archive"
                  />

                  <CollapsiblePrimitive.Content className="overflow-hidden data-[state=open]:animate-[workspace-collapsible-down_180ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[workspace-collapsible-up_160ms_cubic-bezier(0.4,0,0.2,1)] motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none">
                    <div className="space-y-1 border-t border-border/50 pt-1.5">
                      {tickets.length > 0 ? (
                        tickets.map((ticket) => (
                          <TrackerTicketRow
                            key={ticket.id}
                            ticket={ticket}
                            memberById={memberById}
                            presentationMode={presentationMode}
                            onToggleTicketStatus={onToggleTicketStatus}
                            onEditTicket={onEditTicket}
                          />
                        ))
                      ) : (
                        <p className="px-0.5 text-[11px] text-muted-foreground">No objectives yet.</p>
                      )}

                      {hiddenCount > 0 ? (
                        <p className="px-0.5 text-[11px] text-muted-foreground tabular-nums">
                          +{hiddenCount} more objectives
                        </p>
                      ) : null}
                    </div>
                  </CollapsiblePrimitive.Content>
                </div>
              </CollapsiblePrimitive.Root>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Create your first category to start tracking custom objectives.
        </p>
      )}
      <div className="space-y-2 border-t border-border/50 pt-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
          <Input
            value={draftCategoryTitle}
            onChange={(event) => onDraftCategoryTitleChange(event.target.value)}
            placeholder="New category"
            className="h-8 text-xs"
            aria-label="New ticket category"
            disabled={presentationMode}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-2"
            onClick={onCreateCategory}
            disabled={presentationMode}
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Add category</span>
          </Button>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
          <Input
            value={draftTicketTitle}
            onChange={(event) => onDraftTicketTitleChange(event.target.value)}
            placeholder="Add objective"
            className="h-8 text-xs"
            aria-label="New objective title"
            disabled={presentationMode}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-2"
            onClick={onCreateTicket}
            disabled={presentationMode || !draftTicketCategoryId}
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Add objective</span>
          </Button>
        </div>

        <Input
          value={draftTicketDescription}
          onChange={(event) => onDraftTicketDescriptionChange(event.target.value)}
          placeholder="Description"
          className="h-8 text-xs"
          aria-label="Objective description"
          disabled={presentationMode}
        />

        <div className="grid grid-cols-3 gap-1.5">
          <Select
            value={draftTicketPriority}
            onValueChange={(value) => onDraftTicketPriorityChange(value as WorkspaceTrackerTicketPriority)}
            disabled={presentationMode}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="high" className="text-xs">High</SelectItem>
              <SelectItem value="critical" className="text-xs">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={draftTicketDueDate}
            onChange={(event) => onDraftTicketDueDateChange(event.target.value)}
            className="h-8 text-xs"
            aria-label="Objective due date"
            disabled={presentationMode}
          />

          <Select
            value={draftTicketAssigneeId || "none"}
            onValueChange={(value) => onDraftTicketAssigneeIdChange(value === "none" ? "" : value)}
            disabled={presentationMode}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.userId} value={member.userId} className="text-xs">
                  {member.name?.trim() || member.email || member.userId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={draftTicketCategoryId}
          onValueChange={onDraftTicketCategoryIdChange}
          disabled={presentationMode}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Assign category" />
          </SelectTrigger>
          <SelectContent>
            {activeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id} className="text-xs">
                {category.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {archivedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {archivedCategories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant="ghost"
                className="h-7 rounded-full border border-border/60 px-2 text-[11px] text-muted-foreground"
                onClick={() => onToggleCategoryArchive(category.id)}
                disabled={presentationMode}
              >
                <ArchiveRestoreIcon className="mr-1 h-3 w-3" aria-hidden />
                {category.title}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
