import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap"
import Hand from "lucide-react/dist/esm/icons/hand"
import Layers from "lucide-react/dist/esm/icons/layers"
import MapIcon from "lucide-react/dist/esm/icons/map"
import Notebook from "lucide-react/dist/esm/icons/notebook"
import PanelTop from "lucide-react/dist/esm/icons/panel-top"
import Target from "lucide-react/dist/esm/icons/target"

import { type LegacyHomeSectionNavItem } from "@/components/public/legacy-home-sections/types"

export const LEGACY_HOME_SECTION_NAV: LegacyHomeSectionNavItem[] = [
  { id: "hero", label: "Hero", icon: Hand },
  { id: "impact", label: "Impact", icon: Target },
  { id: "platform", label: "Platform", icon: PanelTop },
  { id: "accelerator", label: "Accelerator", icon: CalendarCheck },
  { id: "process", label: "Process", icon: Layers },
  { id: "news", label: "News", icon: Notebook },
  { id: "team", label: "Team", icon: GraduationCap },
  { id: "cta", label: "CTA", icon: MapIcon },
]
