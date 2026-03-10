import type { OrgProfile } from "@/lib/organization/org-profile-brand-types"

export type WorkspaceBrandKitInput = {
  profile: OrgProfile
  canEdit: boolean
  presentationMode?: boolean
}
