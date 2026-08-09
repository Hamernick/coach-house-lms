import { Separator } from "@/components/ui/separator"

import type {
  WorkspaceFinanceDataState,
  WorkspaceFinanceOpportunityInput,
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceRecordInput,
  WorkspaceFinanceSource,
} from "../types"
import { WorkspaceFinanceActivityFeed } from "./workspace-finance-activity-feed"
import { WorkspaceFinanceRaisedSummary } from "./workspace-finance-raised-summary"

export function WorkspaceFinanceActivityDashboard({
  raisedCents,
  raisingPrograms,
  sources,
  targetCents,
  opportunities,
  opportunitiesState,
  records,
  recordsState,
}: {
  raisedCents: number
  raisingPrograms: WorkspaceFinanceRaisingProgram[]
  sources: WorkspaceFinanceSource[]
  targetCents: number | null
  opportunities: WorkspaceFinanceOpportunityInput[]
  opportunitiesState: WorkspaceFinanceDataState
  records: WorkspaceFinanceRecordInput[]
  recordsState: WorkspaceFinanceDataState
}) {
  return (
    <div
      data-workspace-finance-dashboard="activity"
      className="mx-auto w-full max-w-5xl p-4 sm:p-6"
    >
      <WorkspaceFinanceRaisedSummary
        raisedCents={raisedCents}
        raisingPrograms={raisingPrograms}
        sources={sources}
        state={recordsState}
        targetCents={targetCents}
      />

      <Separator className="my-5 sm:my-6" />

      <WorkspaceFinanceActivityFeed
        opportunities={opportunities}
        opportunitiesState={opportunitiesState}
        records={records}
        recordsState={recordsState}
      />
    </div>
  )
}
