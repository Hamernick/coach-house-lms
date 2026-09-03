"use client"

import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"

import { PublicProfileAffiliationSettings } from "./public-profile-affiliation-settings"
import { PublicProfileIdentitySettings } from "./public-profile-identity-settings"
import { PublicProfileSavedCollectionSettings } from "./public-profile-saved-collection-settings"

type PublicProfileSettingsProps = {
  avatarUrl: string | null
  displayName: string
  headline: string
  idPrefix: string
  isUploadingAvatar: boolean
  onAvatarFileSelected: (file?: File | null) => void
  profileDetails: ReactNode
}

export function PublicProfileSettings({
  avatarUrl,
  displayName,
  headline,
  idPrefix,
  isUploadingAvatar,
  onAvatarFileSelected,
  profileDetails,
}: PublicProfileSettingsProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <PublicProfileIdentitySettings
        avatarUrl={avatarUrl}
        displayName={displayName}
        headline={headline}
        idPrefix={`${idPrefix}-identity`}
        isUploadingAvatar={isUploadingAvatar}
        onAvatarFileSelected={onAvatarFileSelected}
        profileDetails={profileDetails}
      />

      <Separator />

      <PublicProfileAffiliationSettings idPrefix={`${idPrefix}-affiliations`} />

      <Separator />

      <PublicProfileSavedCollectionSettings />
    </div>
  )
}
