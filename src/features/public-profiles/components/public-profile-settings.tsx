"use client"

import { Separator } from "@/components/ui/separator"

import { PublicProfileAffiliationSettings } from "./public-profile-affiliation-settings"
import { PublicProfileIdentitySettings } from "./public-profile-identity-settings"
import { PublicProfileSavedCollectionSettings } from "./public-profile-saved-collection-settings"

type PublicProfileSettingsProps = {
  avatarUrl: string | null
  displayName: string
  headline: string
  idPrefix: string
}

export function PublicProfileSettings({
  avatarUrl,
  displayName,
  headline,
  idPrefix,
}: PublicProfileSettingsProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold">Public profile</h3>
        <p className="text-muted-foreground text-sm leading-6">
          Claim your Coach House address, choose what to share, and publish
          when you are ready.
        </p>
      </header>

      <PublicProfileIdentitySettings
        avatarUrl={avatarUrl}
        displayName={displayName}
        headline={headline}
        idPrefix={`${idPrefix}-identity`}
      />

      <Separator />

      <PublicProfileAffiliationSettings
        idPrefix={`${idPrefix}-affiliations`}
      />

      <Separator />

      <PublicProfileSavedCollectionSettings />
    </div>
  )
}
