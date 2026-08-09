"use client"

import { useRef, useState } from "react"
import FileSpreadsheetIcon from "lucide-react/dist/esm/icons/file-spreadsheet"
import PencilLineIcon from "lucide-react/dist/esm/icons/pencil-line"
import PlugIcon from "lucide-react/dist/esm/icons/plug"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { parseWorkspaceFinanceCsvPreview } from "../lib/csv-preview"
import type {
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceRecordInput,
  WorkspaceFinanceStripeConnectionInput,
} from "../types"
import {
  WorkspaceFinanceCsvImportDialog,
  type WorkspaceFinanceCsvSelection,
} from "./workspace-finance-csv-import-dialog"
import { WorkspaceFinanceManualRecordDialog } from "./workspace-finance-manual-record-dialog"
import { WorkspaceFinanceStripeConnection } from "./workspace-finance-stripe-connection"

const MAX_CSV_FILE_BYTES = 2 * 1024 * 1024

export function WorkspaceFinanceConnections({
  disabled = false,
  onRecordCreated,
  onStripeSynced,
  programs,
  stripeConnection,
}: {
  disabled?: boolean
  onRecordCreated: (record: WorkspaceFinanceRecordInput) => void
  onStripeSynced: (input: {
    records: WorkspaceFinanceRecordInput[]
    syncedAt: string
  }) => void
  programs: WorkspaceFinanceRaisingProgram[]
  stripeConnection: WorkspaceFinanceStripeConnectionInput
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [csvSelection, setCsvSelection] =
    useState<WorkspaceFinanceCsvSelection | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [manualRecordOpen, setManualRecordOpen] = useState(false)

  async function handleCsvFile(file: File | undefined) {
    setCsvSelection(null)
    setCsvError(null)
    if (!file) return

    if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
      setCsvError("Choose a .csv file.")
      return
    }

    if (file.size > MAX_CSV_FILE_BYTES) {
      setCsvError("Choose a CSV file smaller than 2 MB.")
      return
    }

    try {
      const source = await file.text()
      setCsvSelection({
        fileName: file.name,
        preview: parseWorkspaceFinanceCsvPreview(source),
        source,
      })
      setPopoverOpen(false)
    } catch (error) {
      setCsvError(
        error instanceof Error ? error.message : "This CSV file cannot be read."
      )
    }
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative h-9 rounded-full px-2 text-xs after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] sm:px-3"
            aria-label={
              disabled
                ? "Turn off sample data to manage Finance connections"
                : "Finance connections"
            }
            disabled={disabled}
          >
            <PlugIcon aria-hidden="true" />
            <span className="hidden sm:inline">Connections</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden p-0"
        >
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-sm font-semibold">Connections</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              Add or import records. Money stays with the source.
            </p>
          </div>

          <div className="divide-y border-t">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                <PencilLineIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Manual record</span>
                <span className="text-muted-foreground block truncate text-xs">
                  External money in or out
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 sm:h-8"
                onClick={() => {
                  setPopoverOpen(false)
                  setManualRecordOpen(true)
                }}
              >
                Add
              </Button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                <FileSpreadsheetIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">CSV import</span>
                <span className="text-muted-foreground block truncate text-xs">
                  Bank or accounting export
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']"
                onClick={() => {
                  if (inputRef.current) inputRef.current.value = ""
                  inputRef.current?.click()
                }}
              >
                Choose
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                aria-label="Choose Finance CSV file"
                onChange={(event) =>
                  void handleCsvFile(event.target.files?.[0])
                }
              />
            </div>

            {csvError ? (
              <div className="px-4 py-3">
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">
                    {csvError}
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            <WorkspaceFinanceStripeConnection
              connection={stripeConnection}
              onSynced={onStripeSynced}
            />
          </div>
        </PopoverContent>
      </Popover>
      {csvSelection ? (
        <WorkspaceFinanceCsvImportDialog
          programs={programs}
          selection={csvSelection}
          onClose={() => setCsvSelection(null)}
        />
      ) : null}
      {manualRecordOpen ? (
        <WorkspaceFinanceManualRecordDialog
          onClose={() => setManualRecordOpen(false)}
          onRecordCreated={onRecordCreated}
          programs={programs}
        />
      ) : null}
    </>
  )
}
