import type { ComponentType, SVGProps } from "react"
import FacebookIcon from "lucide-react/dist/esm/icons/facebook"
import InstagramIcon from "lucide-react/dist/esm/icons/instagram"
import LinkedinIcon from "lucide-react/dist/esm/icons/linkedin"
import Music2Icon from "lucide-react/dist/esm/icons/music-2"
import TwitterIcon from "lucide-react/dist/esm/icons/twitter"
import YoutubeIcon from "lucide-react/dist/esm/icons/youtube"

import type { PersonSocialPlatform } from "@/lib/people/social-links"

const SOCIAL_ICONS: Record<
  PersonSocialPlatform,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  tiktok: Music2Icon,
  twitter: TwitterIcon,
  youtube: YoutubeIcon,
}

export function PersonSocialBrandIcon({
  platform,
  ...props
}: SVGProps<SVGSVGElement> & { platform: PersonSocialPlatform }) {
  const Icon = SOCIAL_ICONS[platform]
  return <Icon {...props} />
}
