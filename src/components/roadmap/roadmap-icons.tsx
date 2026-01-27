import type { ComponentType } from "react"

import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"
import CalendarIcon from "lucide-react/dist/esm/icons/calendar"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import CompassIcon from "lucide-react/dist/esm/icons/compass"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import HandCoinsIcon from "lucide-react/dist/esm/icons/hand-coins"
import HandIcon from "lucide-react/dist/esm/icons/hand"
import LineChartIcon from "lucide-react/dist/esm/icons/line-chart"
import ListChecksIcon from "lucide-react/dist/esm/icons/list-checks"
import MapIcon from "lucide-react/dist/esm/icons/map"
import MegaphoneIcon from "lucide-react/dist/esm/icons/megaphone"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import TargetIcon from "lucide-react/dist/esm/icons/target"
import UsersIcon from "lucide-react/dist/esm/icons/users"
export const ROADMAP_SECTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  origin_story: BookOpenIcon,
  need: HandIcon,
  mission_vision_values: CompassIcon,
  theory_of_change: SparklesIcon,
  program: RocketIcon,
  evaluation: LineChartIcon,
  people: UsersIcon,
  budget: HandCoinsIcon,
  fundraising: HandCoinsIcon,
  fundraising_strategy: TargetIcon,
  fundraising_presentation: FileTextIcon,
  fundraising_crm_plan: MapIcon,
  communications: MegaphoneIcon,
  board_strategy: ClipboardListIcon,
  board_calendar: CalendarIcon,
  board_handbook: BookOpenIcon,
  next_actions: ListChecksIcon,
}
