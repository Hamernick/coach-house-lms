"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProgramCard } from "@/components/programs/program-card"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import type { OrgProgram } from "@/components/organization/org-profile-card/types"
import { locationSummary } from "@/components/organization/org-profile-card/utils"
import { resolveProgramBannerImageUrl, resolveProgramProfileImageUrl, resolveProgramSummary, resolveProgramCardChips } from "@/lib/programs/display"

export function OrganizationProgramsTab({ programs, organizationId, organizationName }: {
  programs: OrgProgram[]
  organizationId: string
  organizationName: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<OrgProgram | null>(null)
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Programs</h2>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {programs.map((program) => (
          <ProgramCard key={program.id} variant="medium"
            title={program.title || "Untitled program"} org={organizationName}
            description={resolveProgramSummary(program) || undefined}
            location={locationSummary(program) || undefined}
            bannerImageUrl={resolveProgramBannerImageUrl(program) || undefined}
            imageUrl={resolveProgramProfileImageUrl(program) || undefined}
            chips={resolveProgramCardChips(program)}
            statusLabel={program.status_label || (program.is_public ? "Published" : "Draft")}
            goalCents={program.goal_cents ?? 0} raisedCents={program.raised_cents ?? 0}
            ctaLabel="View / edit" onCtaClick={() => setEditing(program)}
          />
        ))}
      </div>
      {editing ? <ProgramWizardLazy key={editing.id} mode="edit" program={editing}
        organizationId={organizationId} open onOpenChange={(open) => {
          if (!open) { setEditing(null); router.refresh() }
        }} /> : null}
    </div>
  )
}
