"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import CalendarPlusIcon from "lucide-react/dist/esm/icons/calendar-plus"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { createRoadmapCalendarEvent } from "@/actions/roadmap-calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"

type EventDraft = {
  title: string
  description: string
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
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return {
    title: "",
    description: "",
    startsAt: toDatetimeLocal(start.toISOString()),
    endsAt: toDatetimeLocal(end.toISOString()),
  }
}

export function MyOrganizationAddEventSheetButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<EventDraft>(() => buildDefaultDraft())
  const [formError, setFormError] = useState<string | null>(null)

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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" className="h-9 w-full">
          <CalendarPlusIcon className="h-4 w-4" aria-hidden />
          Add event
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add event</SheetTitle>
          <SheetDescription>Create an internal calendar event without leaving this page.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
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
