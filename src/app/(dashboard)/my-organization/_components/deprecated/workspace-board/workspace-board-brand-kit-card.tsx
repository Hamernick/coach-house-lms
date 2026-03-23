"use client"

import { WorkspaceBrandKitPanel } from "@/features/workspace-brand-kit"

export function WorkspaceBoardBrandKitCard({
  canEdit,
  presentationMode,
  profile,
}: {
  canEdit: boolean
  presentationMode: boolean
  profile: Parameters<typeof WorkspaceBrandKitPanel>[0]["input"]["profile"]
}) {
  return (
    <WorkspaceBrandKitPanel
      input={{
        profile,
        canEdit,
        presentationMode,
      }}
    />
  )
}
