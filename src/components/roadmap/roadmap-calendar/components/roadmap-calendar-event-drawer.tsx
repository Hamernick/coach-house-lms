import type { Dispatch, SetStateAction } from "react"
import RepeatIcon from "lucide-react/dist/esm/icons/repeat"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  formatCalendarRecurrence,
  getRoadmapCalendarEventTypeLabel,
  ROADMAP_CALENDAR_EVENT_TYPES,
  type RoadmapCalendarEvent,
  type RoadmapCalendarRecurrence,
} from "@/lib/roadmap/calendar"

import { ROLE_OPTIONS } from "../constants"
import type { EventDraft } from "../types"

type RoadmapCalendarEventDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingEvent: RoadmapCalendarEvent | null
  draft: EventDraft
  setDraft: Dispatch<SetStateAction<EventDraft>>
  isPending: boolean
  onDelete: () => void
  onSave: () => void
}

export function RoadmapCalendarEventDrawer({
  open,
  onOpenChange,
  editingEvent,
  draft,
  setDraft,
  isPending,
  onDelete,
  onSave,
}: RoadmapCalendarEventDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>{editingEvent ? "Edit event" : "New event"}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="calendar-title">Title</Label>
            <Input
              id="calendar-title"
              value={draft.title}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, title: event.currentTarget.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="calendar-description">Details</Label>
            <Textarea
              id="calendar-description"
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.currentTarget.value }))
              }
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <Select
              value={draft.eventType}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, eventType: value as EventDraft["eventType"] }))
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
            <Label htmlFor="calendar-start">Start</Label>
            <Input
              id="calendar-start"
              type="datetime-local"
              value={draft.startsAt}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, startsAt: event.currentTarget.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="calendar-end">End</Label>
            <Input
              id="calendar-end"
              type="datetime-local"
              value={draft.endsAt}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, endsAt: event.currentTarget.value }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="calendar-all-day"
              checked={draft.allDay}
              onCheckedChange={(checked) =>
                setDraft((prev) => ({ ...prev, allDay: Boolean(checked) }))
              }
            />
            <Label htmlFor="calendar-all-day">All day</Label>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, status: value as EventDraft["status"] }))
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
            <Label>Assign to</Label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <Button
                  key={role.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-auto rounded-full px-3 py-1 text-xs font-medium",
                    draft.assignedRoles.includes(role.id)
                      ? "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                      : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/50",
                  )}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      assignedRoles: prev.assignedRoles.includes(role.id)
                        ? prev.assignedRoles.filter((item) => item !== role.id)
                        : [...prev.assignedRoles, role.id],
                    }))
                  }
                >
                  {role.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Repeat</p>
                <p className="text-xs text-muted-foreground">
                  {draft.recurrence
                    ? formatCalendarRecurrence(draft.recurrence)
                    : "No recurrence"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    recurrence: prev.recurrence ?? { frequency: "monthly" },
                  }))
                }
              >
                <RepeatIcon className="h-4 w-4" aria-hidden />
                Set
              </Button>
            </div>
            {draft.recurrence ? (
              <div className="mt-3 grid gap-2">
                <Label>Frequency</Label>
                <Select
                  value={draft.recurrence.frequency}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      recurrence: {
                        ...(prev.recurrence ?? { frequency: "monthly" }),
                        frequency: value as RoadmapCalendarRecurrence["frequency"],
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid gap-2">
                  <Label htmlFor="calendar-recurrence-end">Ends on (optional)</Label>
                  <Input
                    id="calendar-recurrence-end"
                    type="date"
                    value={draft.recurrence.endDate ?? ""}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        recurrence: prev.recurrence
                          ? { ...prev.recurrence, endDate: event.currentTarget.value || null }
                          : null,
                      }))
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs text-muted-foreground"
                  onClick={() => setDraft((prev) => ({ ...prev, recurrence: null }))}
                >
                  Clear recurrence
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        <DrawerFooter className="border-t border-border/60 bg-background/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {editingEvent ? (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-destructive"
                onClick={onDelete}
              >
                <Trash2Icon className="h-4 w-4" aria-hidden />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={onSave} disabled={isPending}>
                {editingEvent ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
