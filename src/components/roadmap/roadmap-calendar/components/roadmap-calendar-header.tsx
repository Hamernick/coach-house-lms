import CalendarPlusIcon from "lucide-react/dist/esm/icons/calendar-plus"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { RoadmapCalendarEventType } from "@/lib/roadmap/calendar"
import { ROADMAP_CALENDAR_PRESETS } from "@/lib/roadmap/calendar"

type RoadmapCalendarHeaderProps = {
  canManageCalendar: boolean
  onOpenCreate: (preset?: { title?: string; eventType?: RoadmapCalendarEventType }) => void
  onGoToToday: () => void
  isTodaySelected?: boolean
  hideCopy?: boolean
}

export function RoadmapCalendarHeader({
  canManageCalendar,
  onOpenCreate,
  onGoToToday,
  isTodaySelected = false,
  hideCopy = false,
}: RoadmapCalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-2 px-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
      {hideCopy ? (
        <div aria-hidden />
      ) : (
        <div>
          <p className="text-sm font-semibold text-foreground">Board calendar</p>
          <p className="text-xs text-muted-foreground">Track public and internal milestones in one place.</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant={isTodaySelected ? "secondary" : "outline"}
          className="h-8"
          onClick={onGoToToday}
        >
          Today
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="h-8 gap-2" disabled={!canManageCalendar}>
              <CalendarPlusIcon className="h-4 w-4" aria-hidden />
              Add event
              <ChevronDownIcon className="h-3 w-3 text-muted-foreground" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ROADMAP_CALENDAR_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onSelect={() => onOpenCreate({ title: preset.title, eventType: preset.eventType })}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onOpenCreate({})}>Custom event…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
