import { normalizeWorkspaceFinanceInput } from "../lib"
import type { WorkspaceFinanceInput } from "../types"
import { WorkspaceFinanceViewTabs } from "./workspace-finance-view-tabs"

type WorkspaceFinancePanelProps = {
  input?: WorkspaceFinanceInput
}

export function WorkspaceFinancePanel({
  input = {},
}: WorkspaceFinancePanelProps) {
  const finance = normalizeWorkspaceFinanceInput(input)

  return (
    <section
      aria-label="Finance"
      className="mx-auto h-full min-h-0 w-full max-w-3xl overflow-hidden"
    >
      <WorkspaceFinanceViewTabs
        access={input.access}
        initialView={finance.initialView}
        programInputs={input.programs ?? []}
        raisingPrograms={finance.raisingPrograms}
        opportunities={finance.opportunities}
        opportunitiesState={finance.opportunitiesState}
        records={finance.records}
        recordsState={finance.recordsState}
        stripeConnection={input.stripeConnection ?? { state: "not_configured" }}
      />
    </section>
  )
}
