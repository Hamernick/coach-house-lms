"use client"
import { useState } from "react"
import {
  GoogleCalendarPanel,
  usePersonalCalendarEvents,
} from "@/features/google-calendar/client"
import { RoadmapCalendarMonthAgendaPanel } from "./roadmap-calendar/components/roadmap-calendar-month-agenda-panel"
export function RoadmapCalendarPreview() {
  const [month, setMonth] = useState(new Date(2026, 8, 1))
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2026, 8, 8)
  )
  const personalEvents = usePersonalCalendarEvents(month)
  const today = new Date(2026, 8, 8)
  return (
    <RoadmapCalendarMonthAgendaPanel
      month={month}
      selectedDate={selectedDate}
      today={today}
      events={[]}
      dayEvents={[]}
      personalEvents={personalEvents}
      isLoading={false}
      canManageCalendar={false}
      eventDatesByType={{
        meeting: [],
        board_meeting: [],
        deadline: [],
        milestone: [],
        other: [],
      }}
      googleCalendarControls={<GoogleCalendarPanel compact />}
      onMonthChange={setMonth}
      onSelectDate={setSelectedDate}
      onGoToToday={() => setMonth(new Date(2026, 8, 1))}
      onOpenCreate={() => {}}
      onEditEvent={() => {}}
      formatDate={(value) => new Date(value).toLocaleDateString()}
      formatTimeRange={() => ""}
    />
  )
}
