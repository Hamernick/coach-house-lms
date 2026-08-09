import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type {
  WorkspaceFinanceDataState,
  WorkspaceFinanceReconciliationInput,
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceRecordCorrectionResult,
  WorkspaceFinanceRecordInput,
} from "../types"
import {
  WorkspaceFinanceProgramAssignmentMenu,
  type WorkspaceFinanceProgramAssignment,
} from "./workspace-finance-program-assignment-menu"
import { WorkspaceFinanceReconciliationDialog } from "./workspace-finance-reconciliation-dialog"

const statusLabels = {
  draft: "Draft",
  recorded: "Recorded",
  reconciled: "Verified",
} as const

function formatCurrency(
  amountCents: number | null | undefined,
  direction: "in" | "out" | null | undefined,
  currencyCode: string | null | undefined
) {
  if (amountCents == null || !direction) return "—"
  const amount = direction === "out" ? -amountCents : amountCents
  const requestedCurrency = currencyCode?.trim().toUpperCase() || "USD"
  const currency = /^[A-Z]{3}$/.test(requestedCurrency)
    ? requestedCurrency
    : "USD"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount / 100)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function WorkspaceFinanceHistoryStatus({
  onCorrected,
  onReconciled,
  persist,
  programs,
  record,
  status,
}: {
  onCorrected: (result: WorkspaceFinanceRecordCorrectionResult) => void
  onReconciled: (
    recordId: string,
    reconciliation: WorkspaceFinanceReconciliationInput
  ) => void
  persist: boolean
  programs: WorkspaceFinanceRaisingProgram[]
  record: WorkspaceFinanceRecordInput
  status: WorkspaceFinanceRecordInput["status"]
}) {
  return persist &&
    (status === "recorded" ||
      (status === "reconciled" && record.reconciliation)) ? (
    <WorkspaceFinanceReconciliationDialog
      amountLabel={formatCurrency(
        record.amountCents,
        record.direction,
        record.currencyCode
      )}
      dateLabel={formatDate(record.effectiveAt)}
      onCorrected={onCorrected}
      onReconciled={onReconciled}
      persist={persist}
      programs={programs}
      record={record}
    />
  ) : status ? (
    <Badge variant="outline" className="font-normal">
      {record.correction?.state === "corrected"
        ? "Corrected"
        : statusLabels[status]}
    </Badge>
  ) : (
    <span className="text-muted-foreground">—</span>
  )
}

function WorkspaceFinanceHistoryMessage({
  state,
}: {
  state: WorkspaceFinanceDataState
}) {
  const unavailable = state === "error"
  return (
    <Empty
      variant="subtle"
      size="sm"
      className="min-h-48 rounded-none border-0 bg-transparent shadow-none"
      title={unavailable ? "History unavailable" : "No history yet"}
      description={
        unavailable
          ? "Finance records could not be loaded."
          : "Imported and manually recorded activity will appear here."
      }
    />
  )
}

export function WorkspaceFinanceHistory({
  onRecordCorrected,
  onProgramChange,
  onRecordReconciled,
  persistAssignments,
  persistReconciliation,
  programs,
  records,
  state,
}: {
  onRecordCorrected: (result: WorkspaceFinanceRecordCorrectionResult) => void
  onProgramChange: (
    recordId: string,
    assignment: WorkspaceFinanceProgramAssignment
  ) => void
  onRecordReconciled: (
    recordId: string,
    reconciliation: WorkspaceFinanceReconciliationInput
  ) => void
  persistAssignments: boolean
  persistReconciliation: boolean
  programs: WorkspaceFinanceRaisingProgram[]
  records: WorkspaceFinanceRecordInput[]
  state: WorkspaceFinanceDataState
}) {
  return (
    <div
      data-workspace-finance-dashboard="history"
      className="mx-auto w-full max-w-5xl p-4 sm:p-6"
    >
      <div className="overflow-hidden rounded-xl border">
        <div className="divide-y sm:hidden">
          {state === "loading" ? (
            [0, 1, 2].map((row) => (
              <div
                key={row}
                aria-label="Loading history"
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : state === "error" || !records.length ? (
            <WorkspaceFinanceHistoryMessage state={state} />
          ) : (
            records.map((record) => (
              <div key={record.id} className="p-4">
                <div className="flex min-w-0 items-start justify-between gap-4">
                  <p className="min-w-0 truncate text-sm font-medium">
                    {record.typeLabel}
                  </p>
                  <p className="shrink-0 font-mono text-sm tabular-nums">
                    {formatCurrency(
                      record.amountCents,
                      record.direction,
                      record.currencyCode
                    )}
                  </p>
                </div>
                <div className="mt-1 flex min-w-0 items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-muted-foreground truncate text-xs">
                      {[record.sourceLabel, formatDate(record.effectiveAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {isAssignableFinanceRecord(record) ? (
                      <div className="mt-1 min-w-0">
                        <WorkspaceFinanceProgramAssignmentMenu
                          onProgramChange={onProgramChange}
                          persist={persistAssignments}
                          programId={record.programId ?? null}
                          programTitle={record.programTitle ?? null}
                          programs={programs}
                          recordId={record.id}
                        />
                      </div>
                    ) : record.programTitle ? (
                      <p className="text-muted-foreground mt-1 truncate text-xs">
                        {record.programTitle}
                      </p>
                    ) : null}
                  </div>
                  <WorkspaceFinanceHistoryStatus
                    onCorrected={onRecordCorrected}
                    onReconciled={onRecordReconciled}
                    persist={persistReconciliation}
                    programs={programs}
                    record={record}
                    status={record.status}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state === "loading" ? (
                [0, 1, 2].map((row) => (
                  <TableRow key={row} aria-label="Loading history">
                    {[0, 1, 2, 3, 4].map((cell) => (
                      <TableCell key={cell}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : state === "error" ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-0">
                    <Empty
                      variant="subtle"
                      size="sm"
                      className="min-h-48 rounded-none border-0 bg-transparent shadow-none"
                      title="History unavailable"
                      description="Finance records could not be loaded."
                    />
                  </TableCell>
                </TableRow>
              ) : records.length ? (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.effectiveAt)}</TableCell>
                    <TableCell className="max-w-48">
                      <p className="truncate font-medium">
                        {record.sourceLabel}
                      </p>
                      {isAssignableFinanceRecord(record) ? (
                        <div className="mt-0.5 min-w-0">
                          <WorkspaceFinanceProgramAssignmentMenu
                            onProgramChange={onProgramChange}
                            persist={persistAssignments}
                            programId={record.programId ?? null}
                            programTitle={record.programTitle ?? null}
                            programs={programs}
                            recordId={record.id}
                          />
                        </div>
                      ) : record.programTitle ? (
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {record.programTitle}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-48 truncate">
                      {record.typeLabel}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(
                        record.amountCents,
                        record.direction,
                        record.currencyCode
                      )}
                    </TableCell>
                    <TableCell>
                      <WorkspaceFinanceHistoryStatus
                        onCorrected={onRecordCorrected}
                        onReconciled={onRecordReconciled}
                        persist={persistReconciliation}
                        programs={programs}
                        record={record}
                        status={record.status}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-0">
                    <WorkspaceFinanceHistoryMessage state={state} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function isAssignableFinanceRecord(record: WorkspaceFinanceRecordInput) {
  return (
    record.amountCents != null &&
    record.direction != null &&
    record.status === "recorded"
  )
}
