import type { SVGProps } from "react"
import LinkedinIcon from "lucide-react/dist/esm/icons/linkedin"
import {
  siFacebook,
  siInstagram,
  siTiktok,
  siX,
  siYoutube,
  type SimpleIcon,
} from "simple-icons"

import type { PersonSocialPlatform } from "@/lib/people/social-links"

const SIMPLE_SOCIAL_ICONS: Record<
  Exclude<PersonSocialPlatform, "linkedin">,
  SimpleIcon
> = {
  facebook: siFacebook,
  instagram: siInstagram,
  tiktok: siTiktok,
  twitter: siX,
  youtube: siYoutube,
}

export function PersonSocialBrandIcon({
  platform,
  ...props
}: SVGProps<SVGSVGElement> & { platform: PersonSocialPlatform }) {
  if (platform === "linkedin") {
    return <LinkedinIcon {...props} />
  }

  const icon = SIMPLE_SOCIAL_ICONS[platform]
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable="false"
      {...props}
    >
      <path d={icon.path} />
    </svg>
  )
}
