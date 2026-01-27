import type { LucideIcon } from "lucide-react"
import Compass from "lucide-react/dist/esm/icons/compass"
import Flag from "lucide-react/dist/esm/icons/flag"
import Globe from "lucide-react/dist/esm/icons/globe"
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap"
import Handshake from "lucide-react/dist/esm/icons/handshake"
import Layers from "lucide-react/dist/esm/icons/layers"
import Lightbulb from "lucide-react/dist/esm/icons/lightbulb"
import Map from "lucide-react/dist/esm/icons/map"
import Network from "lucide-react/dist/esm/icons/network"
import PenTool from "lucide-react/dist/esm/icons/pen-tool"
import Rocket from "lucide-react/dist/esm/icons/rocket"
import Target from "lucide-react/dist/esm/icons/target"

const TRACK_ICONS: LucideIcon[] = [
  Layers,
  Compass,
  Target,
  Lightbulb,
  Map,
  Flag,
  Network,
  Rocket,
  Globe,
  PenTool,
  Handshake,
  GraduationCap,
]

export function getTrackIcon(label: string | null | undefined): LucideIcon {
  if (!label) return Layers
  let hash = 0
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % TRACK_ICONS.length
  return TRACK_ICONS[idx] ?? Layers
}
