"use client"

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react"
import CalendarCheckIcon from "lucide-react/dist/esm/icons/calendar-check"
import CalendarPlusIcon from "lucide-react/dist/esm/icons/calendar-plus"
import ClockIcon from "lucide-react/dist/esm/icons/clock"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import Globe2Icon from "lucide-react/dist/esm/icons/globe-2"
import UsersIcon from "lucide-react/dist/esm/icons/users"
import VideoIcon from "lucide-react/dist/esm/icons/video"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  COACHING_JOINT_COACH_LABEL,
  COACHING_PATH,
  COACHING_SESSION_MINUTES,
} from "../lib"
import {
  cancelCoachingBookingAction,
  listCoachingAvailabilityAction,
  reserveCoachingBookingAction,
  rescheduleCoachingBookingAction,
} from "../actions"
import {
  addMonths,
  dateFromKey,
  dateKey,
  formatSlotTimeLabel,
  groupSlotsByDate,
  listMonthDates,
  startOfMonth,
  zonedDateKey,
  type TimeFormat,
} from "./coaching-time-picker-utils"
import type {
  CoachingBookingPageData,
  CoachingBookingRecord,
  CoachingCoach,
  CoachingSlot,
} from "../types"

type CoachingBookingFlowProps = {
  initialData: CoachingBookingPageData
}

type FlowStep = "time" | "review" | "done"

function formatDateTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value))
}

function buildGoogleCalendarUrl(booking: CoachingBookingRecord) {
  const dates = `${booking.startsAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}/${booking.endsAt
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")}`
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Coach House session with ${booking.coachName}`,
    dates,
    details: booking.googleMeetUrl ? `Meet link: ${booking.googleMeetUrl}` : "Coach House coaching session",
    location: booking.googleMeetUrl ?? "Google Meet",
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function SlotButton({
  slot,
  selected,
  timeFormat,
  timezone,
  onSelect,
}: {
  slot: CoachingSlot
  selected: boolean
  timeFormat: TimeFormat
  timezone: string
  onSelect: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "grid h-11 min-h-11 w-full grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border px-4 py-0 text-base font-semibold tracking-normal tabular-nums shadow-none transition-[background-color,border-color,color,box-shadow] sm:h-8 sm:min-h-8 sm:gap-2 sm:rounded-lg sm:px-3 sm:text-sm sm:font-medium",
        "border-border/90 bg-card/60 text-foreground hover:border-foreground/70 hover:bg-muted/30",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
        selected && "border-emerald-500 bg-emerald-500/10 text-foreground shadow-[inset_0_0_0_1px_rgb(16_185_129)]",
      )}
      onClick={onSelect}
    >
      <span className="flex justify-end" aria-hidden>
        <span className="size-2.5 rounded-full bg-emerald-500 sm:size-2" />
      </span>
      <span>{formatSlotTimeLabel(slot.startsAt, timezone, timeFormat)}</span>
      <span aria-hidden />
    </Button>
  )
}

function TimeFormatToggle({
  value,
  onChange,
}: {
  value: TimeFormat
  onChange: (nextValue: TimeFormat) => void
}) {
  return (
    <div className="inline-flex w-fit shrink-0 rounded-lg bg-muted p-0.5 sm:rounded-md" role="group" aria-label="Time format">
      {(["12h", "24h"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          variant="ghost"
          aria-pressed={value === option}
          className={cn(
            "h-9 min-h-9 min-w-12 rounded-md px-3 py-0 text-sm font-medium text-muted-foreground shadow-none hover:bg-background/70 hover:text-foreground sm:h-7 sm:min-h-7 sm:min-w-11 sm:px-2.5 sm:text-xs",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            value === option && "bg-background text-foreground shadow-sm hover:bg-background",
          )}
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  )
}

function formatDurationLabel(minutes: number) {
  if (minutes % 60 === 0) return `${minutes / 60}h`
  return `${minutes}m`
}

function formatAvailabilityMessage(message: string | null) {
  if (!message) return "No open sessions on this date."
  if (message.includes("Local Google Calendar broker proxy is not running")) {
    return "Calendar availability is unavailable in this local session. Start the calendar connection and refresh."
  }
  if (message.includes("Google Calendar broker request failed")) {
    return "Calendar availability is temporarily unavailable. Refresh in a moment."
  }
  return message
}

function priceTierLabel(tier: CoachingBookingPageData["creditSummary"]["priceTier"]) {
  if (tier === "included") return "Included session"
  if (tier === "discounted") return "Discounted rate"
  return "Full rate"
}

function SessionAvatarStack({ coaches }: { coaches: CoachingCoach[] }) {
  return (
    <div className="flex -space-x-3">
      {coaches.map((coach) => (
        <Avatar key={coach.id} className="size-12 border-2 border-background">
          <AvatarImage src={coach.imageUrl} alt={coach.name} className="object-cover" />
          <AvatarFallback>{coach.initials}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}

function SessionMetaRow({
  icon: Icon,
  children,
}: {
  icon: typeof ClockIcon
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function SessionDetailsPanel({
  coaches,
  creditSummary,
  timezone,
}: {
  coaches: CoachingCoach[]
  creditSummary: CoachingBookingPageData["creditSummary"]
  timezone: string
}) {
  return (
    <aside className="flex flex-col gap-6 border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-7">
      <div className="flex flex-col gap-5">
        <SessionAvatarStack coaches={coaches} />
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-muted-foreground">{COACHING_JOINT_COACH_LABEL}</p>
          <h2 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">lets talk business</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Meet with Joel and Paula for focused support on strategy, formation, operations, and next steps.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        <SessionMetaRow icon={ClockIcon}>
          <div className="inline-flex rounded-lg bg-muted p-0.5">
            <span className="inline-flex h-9 items-center justify-center rounded-md bg-background px-3 text-sm font-medium text-foreground shadow-sm sm:h-7">
              {formatDurationLabel(COACHING_SESSION_MINUTES)}
            </span>
          </div>
        </SessionMetaRow>
        <SessionMetaRow icon={VideoIcon}>
          <span className="text-sm font-medium text-muted-foreground sm:text-base">Google Meet</span>
        </SessionMetaRow>
        <SessionMetaRow icon={Globe2Icon}>
          <span className="block truncate text-sm font-medium text-muted-foreground sm:text-base">{timezone}</span>
        </SessionMetaRow>
        <SessionMetaRow icon={UsersIcon}>
          <span className="text-sm font-medium text-muted-foreground sm:text-base">
            {creditSummary.available} credit{creditSummary.available === 1 ? "" : "s"} ·{" "}
            {priceTierLabel(creditSummary.priceTier)}
          </span>
        </SessionMetaRow>
      </div>
    </aside>
  )
}

function BookingRow({
  booking,
  onCancel,
  onReschedule,
  pending,
}: {
  booking: CoachingBookingRecord
  onCancel: () => void
  onReschedule: () => void
  pending: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 px-3 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarCheckIcon className="size-4" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium">{booking.coachName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(booking.startsAt, booking.timezone)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {booking.googleMeetUrl ? (
          <Button asChild size="sm" variant="outline" className="h-8 rounded-full shadow-none">
            <a href={booking.googleMeetUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon data-icon="inline-start" aria-hidden />
              Meet
            </a>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline" className="h-8 rounded-full shadow-none">
          <a href={buildGoogleCalendarUrl(booking)} target="_blank" rel="noreferrer">
            <CalendarPlusIcon data-icon="inline-start" aria-hidden />
            Google
          </a>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 rounded-full shadow-none">
          <a href={`/api/coaching/bookings/${booking.id}/calendar.ics`}>
            <CalendarPlusIcon data-icon="inline-start" aria-hidden />
            Apple
          </a>
        </Button>
        {booking.canManage ? (
          <>
            <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={onReschedule}>
              Reschedule
            </Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export function CoachingBookingFlow({ initialData }: CoachingBookingFlowProps) {
  const [step, setStep] = useState<FlowStep>("time")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [slots, setSlots] = useState<CoachingSlot[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<CoachingSlot | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null)
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h")
  const [pending, startTransition] = useTransition()
  const availabilityRequestId = useRef(0)
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || initialData.timezone,
    [initialData.timezone],
  )
  const selectedDateHeading = selectedDate
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
      }).format(selectedDate)
    : "Pick a date"
  const selectedDateKey = selectedDate ? dateKey(selectedDate) : null
  const selectedDaySlots = useMemo(
    () =>
      selectedDateKey
        ? slots.filter((slot) => zonedDateKey(slot.startsAt, timezone) === selectedDateKey)
        : [],
    [selectedDateKey, slots, timezone],
  )
  const slotGroups = useMemo(() => groupSlotsByDate(selectedDaySlots, timezone), [selectedDaySlots, timezone])
  const availableDateKeys = useMemo(
    () => new Set(slots.map((slot) => zonedDateKey(slot.startsAt, timezone))),
    [slots, timezone],
  )
  const availableCalendarDates = useMemo(
    () =>
      Array.from(availableDateKeys)
        .filter((key) => key !== selectedDateKey)
        .map(dateFromKey),
    [availableDateKeys, selectedDateKey],
  )
  const unavailableCalendarDates = useMemo(
    () =>
      listMonthDates(calendarMonth).filter((date) => {
        const key = dateKey(date)
        return key !== selectedDateKey && !availableDateKeys.has(key)
      }),
    [availableDateKeys, calendarMonth, selectedDateKey],
  )
  const paidCheckoutRequired = !rescheduleBookingId && initialData.creditSummary.available <= 0
  const checkoutUnavailable = paidCheckoutRequired && !initialData.paymentConfigured

  useEffect(() => {
    const requestId = availabilityRequestId.current + 1
    availabilityRequestId.current = requestId

    if (!initialData.calendarConfigured) {
      setSlots([])
      setAvailabilityMessage("Coach calendars are not connected yet.")
      setAvailabilityLoading(false)
      return
    }

    const from = startOfMonth(calendarMonth)
    const to = addMonths(from, 1)
    setAvailabilityLoading(true)
    setAvailabilityMessage(null)
    setSlots([])

    void (async () => {
      const result = await listCoachingAvailabilityAction({
        coachId: initialData.selectedCoachId,
        from: from.toISOString(),
        to: to.toISOString(),
        timezone,
      })
      if (availabilityRequestId.current !== requestId) return

      if (!result.ok) {
        setAvailabilityMessage(result.error)
        setSlots([])
        setAvailabilityLoading(false)
        return
      }
      setAvailabilityMessage(
        result.calendarConfigured ? null : "Coach calendars are not connected yet.",
      )
      setSlots(result.slots)
      setAvailabilityLoading(false)
    })()
  }, [calendarMonth, initialData.calendarConfigured, initialData.selectedCoachId, timezone])

  function confirmSelection() {
    if (!selectedSlot) return
    if (checkoutUnavailable) {
      toast.error("Coaching checkout is not configured yet.")
      return
    }
    startTransition(async () => {
      const result = rescheduleBookingId
        ? await rescheduleCoachingBookingAction({
            bookingId: rescheduleBookingId,
            startsAt: selectedSlot.startsAt,
            timezone,
          })
        : await reserveCoachingBookingAction({
            coachId: initialData.selectedCoachId,
            startsAt: selectedSlot.startsAt,
            timezone,
          })

      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if ("checkoutUrl" in result && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
        return
      }
      toast.success(rescheduleBookingId ? "Session rescheduled." : "Session booked.")
      setStep("done")
    })
  }

  function cancelBooking(bookingId: string) {
    startTransition(async () => {
      const result = await cancelCoachingBookingAction({ bookingId })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Session canceled.")
      window.location.assign(COACHING_PATH)
    })
  }

  return (
    <main className="min-h-full px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      <h1 className="sr-only">Coaching</h1>
      <div className="mx-auto flex w-full max-w-[52.25rem] flex-col gap-5 sm:gap-6">
        <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="grid lg:grid-cols-[20rem_minmax(0,1fr)]">
            <SessionDetailsPanel
              coaches={initialData.coaches}
              creditSummary={initialData.creditSummary}
              timezone={timezone}
            />

            <div className="flex min-w-0 flex-col p-5 sm:p-6 lg:pr-3">
              <div className="mx-auto flex w-[316px] max-w-full flex-col gap-7 sm:gap-6 lg:mx-0 lg:w-[30rem]">
                <div className="grid w-full justify-items-stretch gap-x-4 gap-y-7 sm:gap-y-6 lg:grid-cols-[260px_12.75rem] lg:justify-start lg:justify-items-start">
                  <div className="w-[316px] max-w-full min-w-0 lg:w-[260px]">
                    <Calendar
                      mode="single"
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date ?? undefined)
                        if (date) {
                          const nextMonth = startOfMonth(date)
                          setCalendarMonth((currentMonth) =>
                            currentMonth.getTime() === nextMonth.getTime() ? currentMonth : nextMonth,
                          )
                        }
                        setSelectedSlot(null)
                      }}
                      className="w-[316px] max-w-full p-0 [--cell-size:--spacing(10)] lg:w-[260px] lg:[--cell-size:--spacing(8)]"
                      modifiers={{
                        available: availableCalendarDates,
                        unavailable: unavailableCalendarDates,
                      }}
                    />
                  </div>
                  <div className="flex w-[316px] max-w-full min-w-0 flex-col gap-4 lg:w-[12.75rem] lg:gap-3">
                    <div className="flex items-center justify-between gap-3 sm:gap-2">
                      <div className="min-w-0 shrink-0">
                        <h2 className="whitespace-nowrap text-xl font-semibold text-foreground">{selectedDateHeading}</h2>
                      </div>
                      <TimeFormatToggle value={timeFormat} onChange={setTimeFormat} />
                    </div>
                    {!availabilityLoading && slotGroups.length > 0 ? (
                      <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1">
                        {slotGroups.flatMap((group) =>
                          group.slots.map((slot) => (
                            <SlotButton
                              key={slot.id}
                              slot={slot}
                              selected={selectedSlot?.id === slot.id}
                              timeFormat={timeFormat}
                              timezone={timezone}
                              onSelect={() => {
                                setSelectedSlot(slot)
                                setStep("review")
                              }}
                            />
                          )),
                        )}
                      </div>
                    ) : !availabilityLoading ? (
                      <p className="text-sm text-muted-foreground">
                        {formatAvailabilityMessage(
                          availabilityMessage ??
                            (selectedDate ? "No open sessions on this date." : "Pick a date to see available times."),
                        )}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Separator />
                <div className="flex min-h-24 flex-col justify-center rounded-xl border border-border/70 px-4 py-4" aria-live="polite">
                  {step === "review" && selectedSlot ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-sm font-medium">Review session</h2>
                        <p className="text-sm text-muted-foreground">
                          {COACHING_JOINT_COACH_LABEL} · {formatDateTime(selectedSlot.startsAt, timezone)}
                        </p>
                      </div>
                      <Button
                        onClick={confirmSelection}
                        disabled={pending || checkoutUnavailable}
                        className="w-full sm:w-fit"
                      >
                        {pending
                          ? "Confirming..."
                          : rescheduleBookingId
                            ? "Reschedule session"
                            : initialData.creditSummary.available > 0
                              ? "Use coaching credit"
                              : "Continue to checkout"}
                      </Button>
                      {checkoutUnavailable ? (
                        <p className="text-sm text-muted-foreground">
                          Coaching checkout is not configured yet.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <ClockIcon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <h2 className="text-sm font-medium text-foreground">Choose a time</h2>
                        <p className="text-sm leading-5 text-muted-foreground">
                          Pick an open session above to review the session details.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {initialData.upcomingBookings.length > 0 ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium">Upcoming</h2>
            </div>
            <div className="flex flex-col gap-2">
              {initialData.upcomingBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  pending={pending}
                  onCancel={() => cancelBooking(booking.id)}
                  onReschedule={() => {
                    setRescheduleBookingId(booking.id)
                    setSelectedSlot(null)
                    setStep("time")
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
