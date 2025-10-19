import { Globe, Youtube, Box, HardDrive, Video, Clapperboard, FileText, Figma } from "lucide-react"

type IconComponent = React.ComponentType<{ className?: string }>

// Map of known provider slugs to lucide-react icons.
// Keyed broadly as Record<string, Icon> so both ProviderSlug and ModuleResourceProvider unions index cleanly.
export const PROVIDER_ICON: Record<string, IconComponent> = {
  youtube: Youtube,
  "google-drive": HardDrive,
  dropbox: Box,
  loom: Video,
  vimeo: Clapperboard,
  notion: FileText,
  figma: Figma,
  generic: Globe,
}

