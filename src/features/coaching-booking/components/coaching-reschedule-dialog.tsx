"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  listCoachingAvailabilityAction,
  rescheduleCoachingBookingAction,
} from "../actions"
import type { CoachingBookingRecord, CoachingSlot } from "../types"
import { zonedDateKey } from "./coaching-time-picker-utils"

export function CoachingRescheduleDialog({
  booking,
  disabled,
}: {
  booking: CoachingBookingRecord
  disabled: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState("")
  const [slots, setSlots] = useState<CoachingSlot[]>([])
  const [slot, setSlot] = useState("")
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef<string | null>(null)
  useEffect(() => {
    if (!open || !day) return
    let active = true
    setLoading(true)
    setSlot("")
    setError(null)
    // Wide UTC range, then select the requested date in the booking's timezone.
    const from = new Date(`${day}T00:00:00Z`)
    void listCoachingAvailabilityAction({
      coachId: booking.coachId,
      timezone: booking.timezone,
      from: new Date(from.getTime() - 86400000).toISOString(),
      to: new Date(from.getTime() + 2 * 86400000).toISOString(),
    })
      .then((result) => {
        if (!active) return
        if (!result.ok) {
          setError(result.error)
          setSlots([])
        } else
          setSlots(
            result.slots.filter(
              (item) => zonedDateKey(item.startsAt, booking.timezone) === day
            )
          )
      })
      .catch(() => {
        if (active) setError("Unable to load times.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, day, booking.coachId, booking.timezone])
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value)
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule coaching</DialogTitle>
          <DialogDescription>
            With at least 4 hours notice, the same credit moves to your new
            time. With less notice, the original credit is forfeited and another
            available credit is required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`reschedule-date-${booking.id}`}>
              Date · {booking.timezone}
            </Label>
            <Input
              id={`reschedule-date-${booking.id}`}
              type="date"
              disabled={pending}
              value={day}
              onChange={(event) => {
                setDay(event.target.value)
                requestId.current = null
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`reschedule-time-${booking.id}`}>Time</Label>
            <Select
              value={slot}
              disabled={loading || pending}
              onValueChange={(value) => {
                setSlot(value)
                requestId.current = null
              }}
            >
              <SelectTrigger id={`reschedule-time-${booking.id}`}>
                <SelectValue
                  placeholder={loading ? "Loading times…" : "Choose a time"}
                />
              </SelectTrigger>
              <SelectContent>
                {slots.map((item) => (
                  <SelectItem key={item.id} value={item.startsAt}>
                    {new Date(item.startsAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: booking.timezone,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {day && !loading && !slots.length ? (
            <p className="text-muted-foreground text-sm">
              No available times on this date.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Keep current time
          </Button>
          <Button
            disabled={pending || loading || !slot}
            onClick={() => {
              requestId.current ??= crypto.randomUUID()
              const id = requestId.current
              startTransition(async () => {
                try {
                  const result = await rescheduleCoachingBookingAction({
                    bookingId: booking.id,
                    startsAt: slot,
                    timezone: booking.timezone,
                    requestId: id,
                  })
                  if (!result.ok) {
                    setError(result.error)
                    return
                  }
                  setOpen(false)
                  requestId.current = null
                  router.refresh()
                  toast.success("Meeting rescheduled.")
                } catch {
                  setError("Unable to save. Try again.")
                }
              })
            }}
          >
            {pending ? "Rescheduling…" : "Confirm reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
