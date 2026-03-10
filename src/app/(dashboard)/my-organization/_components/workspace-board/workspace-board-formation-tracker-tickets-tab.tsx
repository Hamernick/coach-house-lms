"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CircleDotIcon from "lucide-react/dist/esm/icons/circle-dot"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"
import type { WheelEvent } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { TrackerTicketComposer } from "./workspace-board-formation-tracker-ticket-composer"
import type {
  WorkspaceMemberOption,
  WorkspaceTrackerCategory,
  WorkspaceTrackerTicket,
  WorkspaceTrackerTicketPriority,
} from "./workspace-board-types"

export const VISIBLE_CATEGORY_TICKETS = 4

function stopCanvasWheel(event: WheelEvent<HTMLElement>) {
  event.stopPropagation()
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
    <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/85 px-2.5 py-2">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
            resolveTicketMarkerClassName(ticket.status),
          )}
          aria-hidden
        >
          {ticket.status === "done" ? <CheckIcon className="h-2.5 w-2.5" aria-hidden /> : null}
          {ticket.status === "in_progress" ? <CircleDotIcon className="h-2.5 w-2.5" aria-hidden /> : null}
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
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{ticket.description}</p>
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
    <div className="flex min-h-0 flex-1 flex-col gap-2 pb-1">
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
        <Select
          value={ticketStatusFilter}
          onValueChange={(next) => onTicketStatusFilterChange(next as "all" | "open" | "done")}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All
            </SelectItem>
            <SelectItem value="open" className="text-xs">
              Open
            </SelectItem>
            <SelectItem value="done" className="text-xs">
              Done
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        className="nowheel min-h-0 flex-1 rounded-lg border border-border/60 bg-muted/20"
        onWheelCapture={stopCanvasWheel}
      >
        {activeCategories.length > 0 ? (
          <div className="space-y-1.5 p-2 pb-3">
            {activeCategories.map((category) => {
              const sectionId = `category-${category.id}`
              const isCollapsed = collapsedSections[sectionId] === true
              const allCategoryTickets = (ticketsByCategory.get(category.id) ?? []).filter(matchesFilters)
              const tickets = allCategoryTickets.slice(0, VISIBLE_CATEGORY_TICKETS)
              const hiddenCount = Math.max(0, allCategoryTickets.length - tickets.length)

              return (
                <CollapsiblePrimitive.Root key={category.id} open={!isCollapsed}>
                  <div className="rounded-lg border border-border/60 bg-background/75 px-2 py-1.5 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
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
                      <div className="space-y-1.5 border-t border-border/50 pt-1.5">
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
          <div className="flex min-h-full items-center p-3">
            <p className="text-xs text-muted-foreground">
              Create your first category to start tracking custom objectives.
            </p>
          </div>
        )}
      </ScrollArea>

      <TrackerTicketComposer
        presentationMode={presentationMode}
        draftCategoryTitle={draftCategoryTitle}
        onDraftCategoryTitleChange={onDraftCategoryTitleChange}
        draftTicketTitle={draftTicketTitle}
        onDraftTicketTitleChange={onDraftTicketTitleChange}
        draftTicketDescription={draftTicketDescription}
        onDraftTicketDescriptionChange={onDraftTicketDescriptionChange}
        draftTicketPriority={draftTicketPriority}
        onDraftTicketPriorityChange={onDraftTicketPriorityChange}
        draftTicketDueDate={draftTicketDueDate}
        onDraftTicketDueDateChange={onDraftTicketDueDateChange}
        draftTicketAssigneeId={draftTicketAssigneeId}
        onDraftTicketAssigneeIdChange={onDraftTicketAssigneeIdChange}
        draftTicketCategoryId={draftTicketCategoryId}
        onDraftTicketCategoryIdChange={onDraftTicketCategoryIdChange}
        activeCategories={activeCategories}
        archivedCategories={archivedCategories}
        members={members}
        onCreateCategory={onCreateCategory}
        onCreateTicket={onCreateTicket}
        onToggleCategoryArchive={onToggleCategoryArchive}
      />
    </div>
  )
}
