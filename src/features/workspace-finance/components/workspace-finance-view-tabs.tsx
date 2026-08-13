"use client"

import { useMemo, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { normalizeWorkspaceFinanceInput } from "../lib"
import { WORKSPACE_FINANCE_SAMPLE_INPUT } from "../lib/sample-data"
import type {
  WorkspaceFinanceAccessInput,
  WorkspaceFinanceCorrectionInput,
  WorkspaceFinanceDataState,
  WorkspaceFinanceOpportunityInput,
  WorkspaceFinanceProgramInput,
  WorkspaceFinanceReconciliationInput,
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceRecordInput,
  WorkspaceFinanceRecordCorrectionResult,
  WorkspaceFinanceStripeConnectionInput,
  WorkspaceFinanceView,
} from "../types"
import { WorkspaceFinanceActivityDashboard } from "./workspace-finance-activity-dashboard"
import { WorkspaceFinanceAccessPopover } from "./workspace-finance-access-popover"
import { WorkspaceFinanceConnections } from "./workspace-finance-connections"
import { WorkspaceFinanceExportMenu } from "./workspace-finance-export-menu"
import { WorkspaceFinanceHistory } from "./workspace-finance-history"
import type { WorkspaceFinanceProgramAssignment } from "./workspace-finance-program-assignment-menu"
import { WorkspaceFinanceSampleDataToggle } from "./workspace-finance-sample-data-toggle"

const SAMPLE_DATA_AVAILABLE =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_FINANCE_SAMPLE_DATA === "true"

export function WorkspaceFinanceViewTabs({
  access,
  initialView,
  programInputs,
  raisingPrograms,
  opportunities,
  opportunitiesState,
  records,
  recordsState,
  stripeConnection,
}: {
  access?: WorkspaceFinanceAccessInput
  initialView: WorkspaceFinanceView
  programInputs: WorkspaceFinanceProgramInput[]
  raisingPrograms: WorkspaceFinanceRaisingProgram[]
  opportunities: WorkspaceFinanceOpportunityInput[]
  opportunitiesState: WorkspaceFinanceDataState
  records: WorkspaceFinanceRecordInput[]
  recordsState: WorkspaceFinanceDataState
  stripeConnection: WorkspaceFinanceStripeConnectionInput
}) {
  const [sampleDataEnabled, setSampleDataEnabled] = useState(false)
  const [programAssignments, setProgramAssignments] = useState<
    Record<string, WorkspaceFinanceProgramAssignment>
  >({})
  const [createdRecords, setCreatedRecords] = useState<
    WorkspaceFinanceRecordInput[]
  >([])
  const [reconciliations, setReconciliations] = useState<
    Record<string, WorkspaceFinanceReconciliationInput>
  >({})
  const [corrections, setCorrections] = useState<
    Record<string, WorkspaceFinanceCorrectionInput>
  >({})
  const finance = useMemo(() => {
    const existingRecordIds = new Set(records.map((record) => record.id))
    const liveRecords = [
      ...createdRecords.filter((record) => !existingRecordIds.has(record.id)),
      ...records,
    ]
    const input = sampleDataEnabled
      ? WORKSPACE_FINANCE_SAMPLE_INPUT
      : {
          initialView,
          programs: programInputs,
          opportunities,
          opportunitiesState,
          records: liveRecords,
          recordsState: createdRecords.length ? "ready" : recordsState,
        }

    return normalizeWorkspaceFinanceInput({
      ...input,
      records: input.records?.map((record) => {
        const assignment = programAssignments[record.id]
        const correction = corrections[record.id]
        const reconciliation = reconciliations[record.id]
        const assigned =
          assignment === undefined
            ? record
            : { ...record, programId: assignment?.id ?? null }
        const corrected = correction ? { ...assigned, correction } : assigned
        return reconciliation
          ? { ...corrected, status: "reconciled" as const, reconciliation }
          : corrected
      }),
    })
  }, [
    initialView,
    createdRecords,
    corrections,
    opportunities,
    opportunitiesState,
    programAssignments,
    programInputs,
    records,
    recordsState,
    reconciliations,
    sampleDataEnabled,
  ])

  function handleProgramChange(
    recordId: string,
    assignment: WorkspaceFinanceProgramAssignment
  ) {
    setProgramAssignments((current) => ({
      ...current,
      [recordId]: assignment,
    }))
  }

  function handleRecordCreated(record: WorkspaceFinanceRecordInput) {
    setCreatedRecords((current) => [
      record,
      ...current.filter((item) => item.id !== record.id),
    ])
  }

  function handleStripeSynced({
    records: syncedRecords,
  }: {
    records: WorkspaceFinanceRecordInput[]
    syncedAt: string
  }) {
    setCreatedRecords((current) => {
      const syncedIds = new Set(syncedRecords.map((record) => record.id))
      return [
        ...syncedRecords,
        ...current.filter((record) => !syncedIds.has(record.id)),
      ]
    })
  }

  function handleRecordReconciled(
    recordId: string,
    reconciliation: WorkspaceFinanceReconciliationInput
  ) {
    setReconciliations((current) => ({
      ...current,
      [recordId]: reconciliation,
    }))
  }

  function handleRecordCorrected(
    result: WorkspaceFinanceRecordCorrectionResult
  ) {
    setCreatedRecords((current) => [
      result.replacementRecord,
      ...current.filter((record) => record.id !== result.replacementRecord.id),
    ])
    setCorrections((current) => ({
      ...current,
      [result.originalRecordId]: result.originalCorrection,
      ...(result.replacementRecord.correction
        ? {
            [result.replacementRecord.id]: result.replacementRecord.correction,
          }
        : {}),
    }))
  }

  return (
    <Tabs
      defaultValue={initialView}
      className="flex h-full min-h-0 w-full flex-col gap-0"
    >
      <div className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-6 sm:pt-5">
        <TabsList
          aria-label="Finance views"
          className="bg-muted/60 grid h-9 w-fit grid-cols-2 rounded-full p-0.5 shadow-inner group-data-[orientation=horizontal]/tabs:!h-9"
        >
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-background h-8 rounded-full px-3 text-xs data-[state=active]:shadow-sm"
          >
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-background h-8 rounded-full px-3 text-xs data-[state=active]:shadow-sm"
          >
            History
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {SAMPLE_DATA_AVAILABLE ? (
            <WorkspaceFinanceSampleDataToggle
              checked={sampleDataEnabled}
              onCheckedChange={setSampleDataEnabled}
            />
          ) : null}
          {access?.canManage ? (
            <WorkspaceFinanceAccessPopover initialAccess={access} />
          ) : null}
          <WorkspaceFinanceExportMenu disabled={sampleDataEnabled} />
          <WorkspaceFinanceConnections
            disabled={sampleDataEnabled}
            onRecordCreated={handleRecordCreated}
            onStripeSynced={handleStripeSynced}
            programs={raisingPrograms}
            stripeConnection={stripeConnection}
          />
        </div>
      </div>

      <TabsContent
        value="activity"
        data-workspace-finance-view="activity"
        className="m-0 min-h-0 flex-1 overflow-y-auto overscroll-contain data-[state=inactive]:hidden"
      >
        <WorkspaceFinanceActivityDashboard
          raisedCents={finance.raisedCents}
          raisingPrograms={finance.raisingPrograms}
          sources={finance.sources}
          targetCents={finance.targetCents}
          opportunities={finance.opportunities}
          opportunitiesState={finance.opportunitiesState}
          records={finance.records}
          recordsState={finance.recordsState}
        />
      </TabsContent>
      <TabsContent
        value="history"
        data-workspace-finance-view="history"
        className="m-0 min-h-0 flex-1 overflow-y-auto overscroll-contain data-[state=inactive]:hidden"
      >
        <WorkspaceFinanceHistory
          onRecordCorrected={handleRecordCorrected}
          onProgramChange={handleProgramChange}
          onRecordReconciled={handleRecordReconciled}
          persistAssignments={!sampleDataEnabled}
          persistReconciliation={!sampleDataEnabled}
          programs={finance.raisingPrograms}
          records={finance.records}
          state={finance.recordsState}
        />
      </TabsContent>
    </Tabs>
  )
}
