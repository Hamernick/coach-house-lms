"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { importWorkspaceFinanceCsvBatch } from "@/actions/workspace-finance"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createDefaultWorkspaceFinanceCsvColumns,
  mapWorkspaceFinanceCsvRecords,
  MAX_WORKSPACE_FINANCE_CSV_IMPORT_BATCH,
  WORKSPACE_FINANCE_CSV_RECORD_TYPES,
  type WorkspaceFinanceCsvMapping,
  type WorkspaceFinanceCsvRecordType,
} from "../lib/csv-import"
import type { WorkspaceFinanceCsvPreview } from "../lib/csv-preview"
import type { WorkspaceFinanceRaisingProgram } from "../types"
import { WorkspaceFinanceCsvMappingFields } from "./workspace-finance-csv-mapping-fields"

export type WorkspaceFinanceCsvSelection = {
  fileName: string
  preview: WorkspaceFinanceCsvPreview
  source: string
}

type Props = {
  onClose: () => void
  programs: WorkspaceFinanceRaisingProgram[]
  selection: WorkspaceFinanceCsvSelection
}

export function WorkspaceFinanceCsvImportDialog({
  onClose,
  programs,
  selection,
}: Props) {
  const router = useRouter()
  const defaults = createDefaultWorkspaceFinanceCsvColumns(
    selection.preview.headers
  )
  const [dateColumn, setDateColumn] = useState(defaults.dateColumn)
  const [amountColumn, setAmountColumn] = useState(defaults.amountColumn)
  const [sourceColumn, setSourceColumn] = useState(defaults.sourceColumn)
  const [recordTypeSelection, setRecordTypeSelection] = useState(
    defaults.typeColumn ? `column:${defaults.typeColumn}` : ""
  )
  const [currencySelection, setCurrencySelection] = useState(
    defaults.currencyColumn ? `column:${defaults.currencyColumn}` : "fixed:USD"
  )
  const [programSelection, setProgramSelection] = useState("organization")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const mapping = buildMapping({
    amountColumn,
    currencySelection,
    dateColumn,
    recordTypeSelection,
    sourceColumn,
  })

  function importCsv() {
    if (!mapping) return
    setError(null)

    startTransition(async () => {
      let imported = 0
      let skipped = 0
      try {
        const records = mapWorkspaceFinanceCsvRecords({
          mapping,
          source: selection.source,
        })
        const fileFingerprint = await createFileFingerprint(selection.source)

        for (
          let index = 0;
          index < records.length;
          index += MAX_WORKSPACE_FINANCE_CSV_IMPORT_BATCH
        ) {
          const batch = records.slice(
            index,
            index + MAX_WORKSPACE_FINANCE_CSV_IMPORT_BATCH
          )
          const result = await importWorkspaceFinanceCsvBatch({
            fileFingerprint,
            finalBatch: index + batch.length === records.length,
            programId:
              programSelection === "organization" ? null : programSelection,
            records: batch,
          })
          if ("error" in result) {
            const partial = imported
              ? ` ${imported.toLocaleString()} records were imported before it stopped.`
              : ""
            throw new Error(`${result.error}${partial}`)
          }
          imported += result.imported
          skipped += result.skipped
        }

        toast.success(
          imported
            ? `${imported.toLocaleString()} Finance records imported${
                skipped
                  ? `; ${skipped.toLocaleString()} duplicates skipped`
                  : ""
              }.`
            : "This CSV was already imported."
        )
        router.refresh()
        onClose()
      } catch (importError) {
        setError(
          importError instanceof Error
            ? importError.message
            : "This CSV could not be imported."
        )
      }
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            {selection.fileName} has{" "}
            {selection.preview.rowCount.toLocaleString()} records. Map its
            columns before adding them to History.
          </DialogDescription>
        </DialogHeader>

        <WorkspaceFinanceCsvMappingFields
          amountColumn={amountColumn}
          currencySelection={currencySelection}
          dateColumn={dateColumn}
          headers={selection.preview.headers}
          programSelection={programSelection}
          programs={programs}
          recordTypeSelection={recordTypeSelection}
          setAmountColumn={setAmountColumn}
          setCurrencySelection={setCurrencySelection}
          setDateColumn={setDateColumn}
          setProgramSelection={setProgramSelection}
          setRecordTypeSelection={setRecordTypeSelection}
          setSourceColumn={setSourceColumn}
          sourceColumn={sourceColumn}
        />

        <p className="text-muted-foreground text-xs leading-5">
          Imported rows are recorded immediately. Inbound Donations, Grants,
          Earned revenue, and Other income update Raised. Program assignment
          applies to every row in this file.
        </p>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!mapping || isPending}
            onClick={importCsv}
          >
            {isPending
              ? "Importing…"
              : `Import ${selection.preview.rowCount.toLocaleString()} records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function buildMapping({
  amountColumn,
  currencySelection,
  dateColumn,
  recordTypeSelection,
  sourceColumn,
}: {
  amountColumn: string
  currencySelection: string
  dateColumn: string
  recordTypeSelection: string
  sourceColumn: string
}): WorkspaceFinanceCsvMapping | null {
  if (!amountColumn || !dateColumn || !recordTypeSelection || !sourceColumn)
    return null

  const fixedRecordType = recordTypeSelection.slice("fixed:".length)
  const validFixedType = WORKSPACE_FINANCE_CSV_RECORD_TYPES.some(
    ({ value }) => value === fixedRecordType
  )
  const recordType: WorkspaceFinanceCsvMapping["recordType"] | null =
    recordTypeSelection.startsWith("column:")
      ? { mode: "column", column: recordTypeSelection.slice("column:".length) }
      : recordTypeSelection.startsWith("fixed:") && validFixedType
        ? {
            mode: "fixed",
            value: fixedRecordType as WorkspaceFinanceCsvRecordType,
          }
        : null
  if (!recordType) return null

  const currency: WorkspaceFinanceCsvMapping["currency"] =
    currencySelection.startsWith("column:")
      ? { mode: "column", column: currencySelection.slice("column:".length) }
      : { mode: "fixed", value: "USD" }

  return { amountColumn, currency, dateColumn, recordType, sourceColumn }
}

async function createFileFingerprint(source: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source)
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}
