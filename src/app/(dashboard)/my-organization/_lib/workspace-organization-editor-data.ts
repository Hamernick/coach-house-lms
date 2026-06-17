import type { OrgPerson } from "@/actions/people"
import type {
  OrgProfile,
  OrgProgram,
} from "@/components/organization/org-profile-card/types"
import { buildDocumentsTabData } from "@/components/organization/org-profile-card/tabs/documents-tab/data"
import type { FiscalSponsorshipProjectWorkflowSummary } from "@/features/fiscal-sponsorship"
import { resolvePeopleDisplayImages } from "@/lib/people/display-images"
import type { RoadmapSection } from "@/lib/roadmap"
import { buildFiscalSponsorshipApplicationPrefill } from "./workspace-fiscal-sponsorship-prefill"

export async function buildWorkspaceOrganizationEditorData({
  applicantEmail,
  applicantFullName,
  canAccessRoadmapDocuments,
  canEdit,
  fiscalSponsorshipProjectId,
  fiscalSponsorshipWorkflowSummary,
  initialProfile,
  peopleNormalized,
  profile,
  programs,
  publicSlug,
  roadmapSections,
}: {
  applicantEmail?: string | null
  applicantFullName?: string | null
  canAccessRoadmapDocuments: boolean
  canEdit: boolean
  fiscalSponsorshipProjectId: string | null
  fiscalSponsorshipWorkflowSummary: FiscalSponsorshipProjectWorkflowSummary | null
  initialProfile: OrgProfile
  peopleNormalized: OrgPerson[]
  profile: Record<string, unknown>
  programs: OrgProgram[] | null | undefined
  publicSlug: string | null
  roadmapSections: RoadmapSection[]
}) {
  const people = await resolvePeopleDisplayImages(peopleNormalized)
  const orgPrograms = programs ?? []

  return {
    initialProfile,
    roadmapSections,
    people,
    programs: orgPrograms,
    fiscalSponsorshipProjectId,
    fiscalSponsorshipWorkflowSummary,
    fiscalSponsorshipApplicationPrefill:
      buildFiscalSponsorshipApplicationPrefill({
        applicantEmail,
        applicantFullName,
        initialProfile,
        programs: orgPrograms,
      }),
    documentsTab: buildDocumentsTabData({
      canAccessRoadmapDocuments,
      profile,
      programs: orgPrograms,
      publicSlug,
      roadmapSections,
    }),
    canEdit,
  }
}
