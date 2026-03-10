"use client"

import type { Dispatch, SetStateAction } from "react"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { ROLE_OPTIONS } from "@/components/roadmap/roadmap-calendar/constants"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  getRoadmapCalendarEventTypeLabel,
  ROADMAP_CALENDAR_EVENT_TYPES,
  type RoadmapCalendarRecurrence,
} from "@/lib/roadmap/calendar"

import type { CalendarEventDraft } from "./workspace-board-calendar-event-sheet-helpers"

export function WorkspaceBoardCalendarEventSheetFormFields({
  draft,
  setDraft,
  formError,
}: {
  draft: CalendarEventDraft
  setDraft: Dispatch<SetStateAction<CalendarEventDraft>>
  formError: string | null
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
      <div className="grid gap-2">
        <Label htmlFor="workspace-calendar-title">Title</Label>
        <Input
          id="workspace-calendar-title"
          value={draft.title}
          onChange={(eventValue) =>
            setDraft((previous) => ({
              ...previous,
              title: eventValue.currentTarget.value,
            }))
          }
          placeholder="Board check-in"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-calendar-details">Details</Label>
        <Textarea
          id="workspace-calendar-details"
          rows={3}
          value={draft.description}
          onChange={(eventValue) =>
            setDraft((previous) => ({
              ...previous,
              description: eventValue.currentTarget.value,
            }))
          }
          placeholder="Agenda, prep notes, or meeting link."
        />
      </div>

      <div className="grid gap-2">
        <Label>Type</Label>
        <Select
          value={draft.eventType}
          onValueChange={(nextType) =>
            setDraft((previous) => ({
              ...previous,
              eventType: nextType as CalendarEventDraft["eventType"],
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROADMAP_CALENDAR_EVENT_TYPES.map((eventType) => (
              <SelectItem key={eventType} value={eventType}>
                {getRoadmapCalendarEventTypeLabel(eventType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-calendar-start">Start</Label>
        <Input
          id="workspace-calendar-start"
          type="datetime-local"
          value={draft.startsAt}
          onChange={(eventValue) =>
            setDraft((previous) => ({
              ...previous,
              startsAt: eventValue.currentTarget.value,
            }))
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-calendar-end">End</Label>
        <Input
          id="workspace-calendar-end"
          type="datetime-local"
          value={draft.endsAt}
          onChange={(eventValue) =>
            setDraft((previous) => ({
              ...previous,
              endsAt: eventValue.currentTarget.value,
            }))
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="workspace-calendar-all-day"
          checked={draft.allDay}
          onCheckedChange={(checked) =>
            setDraft((previous) => ({
              ...previous,
              allDay: Boolean(checked),
            }))
          }
        />
        <Label htmlFor="workspace-calendar-all-day">All day</Label>
      </div>

      <div className="grid gap-2">
        <Label>Status</Label>
        <Select
          value={draft.status}
          onValueChange={(nextStatus) =>
            setDraft((previous) => ({
              ...previous,
              status: nextStatus === "canceled" ? "canceled" : "active",
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Invite roles</Label>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => (
            <Button
              key={role.id}
              type="button"
              size="sm"
              variant="outline"
              className={cn(
                "h-auto rounded-full px-3 py-1 text-xs font-medium",
                draft.assignedRoles.includes(role.id)
                  ? "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/50",
              )}
              onClick={() =>
                setDraft((previous) => ({
                  ...previous,
                  assignedRoles: previous.assignedRoles.includes(role.id)
                    ? previous.assignedRoles.filter((item) => item !== role.id)
                    : [...previous.assignedRoles, role.id],
                }))
              }
            >
              {role.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border border-border/60 bg-background/30 p-3">
        <Label>Recurrence</Label>
        <Select
          value={draft.recurrence?.frequency ?? "none"}
          onValueChange={(value) =>
            setDraft((previous) => ({
              ...previous,
              recurrence:
                value === "none"
                  ? null
                  : { ...(previous.recurrence ?? {}), frequency: value as RoadmapCalendarRecurrence["frequency"] },
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No recurrence</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select>

        {draft.recurrence ? (
          <div className="grid gap-2">
            <Label htmlFor="workspace-calendar-recurrence-end">Ends on (optional)</Label>
            <Input
              id="workspace-calendar-recurrence-end"
              type="date"
              value={draft.recurrence.endDate ?? ""}
              onChange={(eventValue) =>
                setDraft((previous) => ({
                  ...previous,
                  recurrence: previous.recurrence
                    ? {
                        ...previous.recurrence,
                        endDate: eventValue.currentTarget.value || null,
                      }
                    : null,
                }))
              }
            />
          </div>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {formError}
        </p>
      ) : null}
    </div>
  )
}

export function WorkspaceBoardCalendarEventSheetFooter({
  mode,
  canEditTarget,
  isPending,
  onDelete,
  onCancel,
  onSave,
}: {
  mode: "create" | "edit"
  canEditTarget: boolean
  isPending: boolean
  onDelete: () => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <SheetFooter className="border-t border-border/60 bg-background/90">
      {mode === "edit" ? (
        <Button
          type="button"
          variant="ghost"
          className="mr-auto text-destructive"
          onClick={onDelete}
          disabled={!canEditTarget || isPending}
        >
          <Trash2Icon className="h-4 w-4" aria-hidden />
          Delete
        </Button>
      ) : null}
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" onClick={onSave} disabled={!canEditTarget || isPending}>
        {isPending ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {mode === "edit" ? "Save event" : "Create event"}
      </Button>
    </SheetFooter>
  )
}
