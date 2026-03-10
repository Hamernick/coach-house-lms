"use client"

import { WorkspaceBoardCanvas } from "./workspace-board-canvas"
import type { WorkspaceOrganizationEditorData, WorkspaceSeedData } from "./workspace-board-types"

export function MyOrganizationWorkspaceView({
  seed,
  onInitialOnboardingSubmit,
  organizationEditorData,
}: {
  seed: WorkspaceSeedData
  onInitialOnboardingSubmit: (form: FormData) => Promise<void>
  organizationEditorData: WorkspaceOrganizationEditorData
}) {
  return (
    <div className="-m-[var(--shell-content-pad)] flex min-h-[calc(100%_+_var(--shell-content-pad)_+_var(--shell-content-pad))] flex-1 flex-col">
      <WorkspaceBoardCanvas
        seed={seed}
        onInitialOnboardingSubmit={onInitialOnboardingSubmit}
        organizationEditorData={organizationEditorData}
      />
    </div>
  )
}
