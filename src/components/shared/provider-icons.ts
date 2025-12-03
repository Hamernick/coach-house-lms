import Globe from "lucide-react/dist/esm/icons/globe"
import Youtube from "lucide-react/dist/esm/icons/youtube"
import Box from "lucide-react/dist/esm/icons/box"
import HardDrive from "lucide-react/dist/esm/icons/hard-drive"
import Video from "lucide-react/dist/esm/icons/video"
import Clapperboard from "lucide-react/dist/esm/icons/clapperboard"
import FileText from "lucide-react/dist/esm/icons/file-text"
import Figma from "lucide-react/dist/esm/icons/figma"
import LinkIcon from "lucide-react/dist/esm/icons/link"
import Linkedin from "lucide-react/dist/esm/icons/linkedin"
import Facebook from "lucide-react/dist/esm/icons/facebook"
import Github from "lucide-react/dist/esm/icons/github"
import Instagram from "lucide-react/dist/esm/icons/instagram"
import Mail from "lucide-react/dist/esm/icons/mail"

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
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  github: Github,
  link: LinkIcon,
  email: Mail,
}
