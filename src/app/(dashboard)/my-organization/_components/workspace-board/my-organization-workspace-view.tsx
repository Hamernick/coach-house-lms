"use client"

import { WorkspaceBoardCanvas } from "./workspace-board-canvas"
import type { WorkspaceFinanceInput } from "@/features/workspace-finance"
import type {
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
} from "./workspace-board-types"

export function MyOrganizationWorkspaceView({
  seed,
  onInitialOnboardingSubmit,
  organizationEditorData,
  financeInput,
}: {
  seed: WorkspaceSeedData
  onInitialOnboardingSubmit: (form: FormData) => Promise<void>
  organizationEditorData: WorkspaceOrganizationEditorData
  financeInput: WorkspaceFinanceInput
}) {
  return (
    <div className="-m-[var(--shell-content-pad)] flex min-h-[calc(100%_+_var(--shell-content-pad)_+_var(--shell-content-pad))] min-w-0 flex-1 flex-col">
      <WorkspaceBoardCanvas
        key={seed.orgId}
        seed={seed}
        onInitialOnboardingSubmit={onInitialOnboardingSubmit}
        organizationEditorData={organizationEditorData}
        financeInput={financeInput}
      />
    </div>
  )
}
