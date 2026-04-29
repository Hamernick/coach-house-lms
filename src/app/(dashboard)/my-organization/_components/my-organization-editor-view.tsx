"use client"

import { useRouter } from "next/navigation"

import { OrgProfileCard } from "@/components/organization/org-profile-card"
import type { OrgProgram, OrgProfile, ProfileTab } from "@/components/organization/org-profile-card/types"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { cn } from "@/lib/utils"
import { WORKSPACE_PATH } from "@/lib/workspace/routes"

type MyOrganizationEditorViewProps = {
  initialProfile: OrgProfile
  people: OrgPersonWithImage[]
  programs: OrgProgram[]
  initialTab?: ProfileTab
  initialProgramId?: string | null
  canEdit: boolean
  embedded?: boolean
  onClose?: () => void
}

export function MyOrganizationEditorView({
  initialProfile,
  people,
  programs,
  initialTab,
  initialProgramId,
  canEdit,
  embedded = false,
  onClose,
}: MyOrganizationEditorViewProps) {
  const router = useRouter()
  const handleClose = onClose ?? (() => router.push(WORKSPACE_PATH))

  return (
    <div className={cn("flex flex-col", embedded ? "h-full min-h-0 gap-4" : "gap-5 md:gap-6")}>
      {!embedded ? <PageTutorialButton tutorial="my-organization" /> : null}
      <section className={cn(embedded ? "flex min-h-0 flex-1 flex-col gap-3" : "space-y-3")}>
        <div className={cn(embedded && "min-h-0 flex-1 overflow-y-auto")}>
          <OrgProfileCard
            initial={initialProfile}
            people={people}
            programs={programs}
            initialTab={initialTab}
            initialProgramId={initialProgramId}
            canEdit={canEdit}
            onClose={handleClose}
          />
        </div>
      </section>
      {!embedded ? <div aria-hidden className="h-5 shrink-0 md:h-6" /> : null}
    </div>
  )
}
