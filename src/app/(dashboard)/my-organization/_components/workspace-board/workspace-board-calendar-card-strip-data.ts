import { safeDateLabel } from "../../_lib/helpers"
import type { MyOrganizationCalendarView } from "../../_lib/types"

export type CalendarStripEventItem = {
  id: string
  title: string
  timeLabel: string
  invitesLabel: string | null
}

export type CalendarStripNotificationItem = {
  id: string
  label: string
  detail: string
}

export type CalendarStripObjectiveItem = {
  id: string
  title: string
  status: "active" | "todo" | "done"
}

export function buildCalendarStripEventPreview({
  visibleEvents,
  selectedDayEvents,
  recommendedIntervalMonths,
}: {
  visibleEvents: MyOrganizationCalendarView["upcomingEvents"]
  selectedDayEvents: MyOrganizationCalendarView["upcomingEvents"]
  recommendedIntervalMonths: number
}) {
  const shouldShowPreviewData = visibleEvents.length === 0 && selectedDayEvents.length === 0

  const eventItems: CalendarStripEventItem[] = !shouldShowPreviewData
    ? visibleEvents.map((event) => ({
        id: event.id,
        title: event.title,
        timeLabel: event.all_day ? safeDateLabel(event.starts_at) : safeDateLabel(event.starts_at, true),
        invitesLabel: event.assigned_roles.length ? `Invites: ${event.assigned_roles.join(", ")}` : null,
      }))
    : [
        {
          id: "preview-event-1",
          title: "Board check-in",
          timeLabel: "Today · 10:00 AM",
          invitesLabel: "Invites: Board",
        },
        {
          id: "preview-event-2",
          title: "Program cohort launch sync",
          timeLabel: "Today · 2:30 PM",
          invitesLabel: "Invites: Program team",
        },
      ]

  const notificationItems: CalendarStripNotificationItem[] =
    eventItems.length > 0
      ? eventItems.slice(0, 3).map((item, index) => ({
          id: `notification-${item.id}`,
          label: index === 0 ? "Starting soon" : index === 1 ? "Reminder sent" : "Needs confirmation",
          detail: item.title,
        }))
      : [
          {
            id: "notification-preview-1",
            label: "Cadence active",
            detail:
              recommendedIntervalMonths === 3
                ? "Quarterly board cadence reminder configured."
                : "Monthly board cadence reminder configured.",
          },
        ]

  return {
    eventItems,
    notificationItems,
    selectedDayEventCount: shouldShowPreviewData ? eventItems.length : selectedDayEvents.length,
  }
}

export const CALENDAR_STRIP_OBJECTIVE_PREVIEW_ITEMS: CalendarStripObjectiveItem[] = [
  { id: "objective-1", title: "Finalize board packet", status: "active" },
  { id: "objective-2", title: "Confirm guest speaker", status: "todo" },
  { id: "objective-3", title: "Publish monthly update", status: "done" },
]
