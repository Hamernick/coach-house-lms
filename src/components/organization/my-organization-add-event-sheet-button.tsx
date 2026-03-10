"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import CalendarPlusIcon from "lucide-react/dist/esm/icons/calendar-plus"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { createRoadmapCalendarEvent } from "@/actions/roadmap-calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ROADMAP_CALENDAR_PRESETS } from "@/lib/roadmap/calendar"
import type { RoadmapCalendarEventType } from "@/lib/roadmap/calendar"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type EventDraft = {
  presetId: (typeof ROADMAP_CALENDAR_PRESETS)[number]["id"]
  title: string
  description: string
  eventType: RoadmapCalendarEventType
  startsAt: string
  endsAt: string
}

function toDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString()
}

function buildDefaultDraft(): EventDraft {
  const defaultPreset = ROADMAP_CALENDAR_PRESETS[0]
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return {
    presetId: defaultPreset.id,
    title: defaultPreset.title,
    description: "",
    eventType: defaultPreset.eventType,
    startsAt: toDatetimeLocal(start.toISOString()),
    endsAt: toDatetimeLocal(end.toISOString()),
  }
}

export function MyOrganizationAddEventSheetButton({
  iconOnly = false,
  className,
}: {
  iconOnly?: boolean
  className?: string
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<EventDraft>(() => buildDefaultDraft())
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setDraft(buildDefaultDraft())
      setFormError(null)
    }
  }

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      setFormError("Event title is required.")
      return
    }
    if (!draft.startsAt) {
      setFormError("Start date is required.")
      return
    }

    setFormError(null)
    startTransition(async () => {
      const result = await createRoadmapCalendarEvent({
        calendarType: "internal",
        event: {
          title: draft.title.trim(),
          description: draft.description.trim(),
          eventType: draft.eventType,
          startsAt: fromDatetimeLocal(draft.startsAt),
          endsAt: draft.endsAt ? fromDatetimeLocal(draft.endsAt) : null,
          allDay: false,
          status: "active",
          assignedRoles: ["admin"],
          recurrence: null,
        },
      })

      if ("error" in result) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      toast.success("Event added")
      setOpen(false)
      router.refresh()
    })
  }

  if (!mounted) {
    return (
      <Button
        type="button"
        size={iconOnly ? "icon" : "sm"}
        variant={iconOnly ? "ghost" : "default"}
        className={cn(iconOnly ? "h-7 w-7" : "h-9 w-full", className)}
        disabled
      >
        <CalendarPlusIcon className="h-4 w-4" aria-hidden />
        <span className="sr-only">Add event</span>
        {!iconOnly ? <span>Add event</span> : null}
      </Button>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size={iconOnly ? "icon" : "sm"}
          variant={iconOnly ? "ghost" : "default"}
          className={cn(iconOnly ? "h-7 w-7" : "h-9 w-full", className)}
        >
          <CalendarPlusIcon className="h-4 w-4" aria-hidden />
          <span className="sr-only">Add event</span>
          {!iconOnly ? <span>Add event</span> : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add event</SheetTitle>
          <SheetDescription>Create an internal calendar event without leaving this page.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="quick-event-preset">Type</Label>
            <Select
              value={draft.presetId}
              onValueChange={(presetId) => {
                setDraft((previous) => {
                  const previousPreset = ROADMAP_CALENDAR_PRESETS.find(
                    (entry) => entry.id === previous.presetId,
                  )
                  const nextPreset = ROADMAP_CALENDAR_PRESETS.find(
                    (entry) => entry.id === presetId,
                  )
                  if (!nextPreset) return previous
                  const shouldReplaceTitle =
                    previous.title.trim().length === 0 ||
                    previous.title === (previousPreset?.title ?? "")
                  return {
                    ...previous,
                    presetId: nextPreset.id,
                    eventType: nextPreset.eventType,
                    title: shouldReplaceTitle ? nextPreset.title : previous.title,
                  }
                })
              }}
            >
              <SelectTrigger id="quick-event-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROADMAP_CALENDAR_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quick-event-title">Title</Label>
            <Input
              id="quick-event-title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.currentTarget.value }))}
              placeholder="Board check-in"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quick-event-details">Details</Label>
            <Textarea
              id="quick-event-details"
              rows={3}
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.currentTarget.value }))}
              placeholder="Agenda, call link, or preparation notes."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quick-event-start">Start</Label>
            <Input
              id="quick-event-start"
              type="datetime-local"
              value={draft.startsAt}
              onChange={(event) => setDraft((prev) => ({ ...prev, startsAt: event.currentTarget.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quick-event-end">End</Label>
            <Input
              id="quick-event-end"
              type="datetime-local"
              value={draft.endsAt}
              onChange={(event) => setDraft((prev) => ({ ...prev, endsAt: event.currentTarget.value }))}
            />
          </div>

          {formError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          ) : null}
        </div>

        <SheetFooter className="border-t border-border/60 bg-background/90">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Save event
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
