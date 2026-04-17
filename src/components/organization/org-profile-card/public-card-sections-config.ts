import { PROVIDER_ICON } from "@/components/shared/provider-icons"

import type { OrgProfile } from "./types"

type PublicCardSocialFieldKey = keyof Pick<
  OrgProfile,
  | "twitter"
  | "facebook"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "github"
>

export const PUBLIC_CARD_SOCIAL_FIELDS: Array<{
  label: string
  key: PublicCardSocialFieldKey
  icon: keyof typeof PROVIDER_ICON
}> = [
  { label: "Twitter / X", key: "twitter", icon: "link" },
  { label: "Facebook", key: "facebook", icon: "facebook" },
  { label: "LinkedIn", key: "linkedin", icon: "linkedin" },
  { label: "Instagram", key: "instagram", icon: "instagram" },
  { label: "YouTube", key: "youtube", icon: "youtube" },
  { label: "TikTok", key: "tiktok", icon: "link" },
  { label: "GitHub", key: "github", icon: "github" },
]

export const PUBLIC_CARD_HEADER_SQUARES: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 3],
  [5, 5],
  [10, 10],
  [12, 15],
  [15, 10],
  [10, 15],
  [15, 10],
  [10, 15],
  [15, 10],
]
