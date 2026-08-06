import type { OrgPerson } from "@/actions/people"
import type { ProfileTab } from "@/components/organization/org-profile-card/types"
import { resolvePeopleDisplayImages } from "@/lib/people/display-images"

import type { buildInitialOrganizationProfile } from "./helpers"
import type { fetchWorkspacePrograms } from "./my-organization-page-content-support"

export async function renderMyOrganizationEditorView({
  canEdit,
  initialProfile,
  initialProgramId,
  initialTab,
  peopleNormalized,
  programs,
}: {
  canEdit: boolean
  initialProfile: ReturnType<typeof buildInitialOrganizationProfile>
  initialProgramId: string | null
  initialTab?: ProfileTab
  peopleNormalized: OrgPerson[]
  programs: Awaited<ReturnType<typeof fetchWorkspacePrograms>>
}) {
  const { MyOrganizationEditorView } =
    await import("../_components/my-organization-editor-view")
  const people = await resolvePeopleDisplayImages(peopleNormalized)

  return (
    <MyOrganizationEditorView
      initialProfile={initialProfile}
      people={people}
      programs={programs ?? []}
      initialTab={initialTab}
      initialProgramId={initialProgramId}
      canEdit={canEdit}
    />
  )
}

export function resolveLegacyEditorTab(tabParam: string) {
  const allowedTabs: ProfileTab[] = ["company", "programs", "people"]
  return allowedTabs.includes(tabParam as ProfileTab)
    ? (tabParam as ProfileTab)
    : undefined
}
