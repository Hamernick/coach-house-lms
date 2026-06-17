"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import FileSpreadsheetIcon from "lucide-react/dist/esm/icons/file-spreadsheet"
import FileUpIcon from "lucide-react/dist/esm/icons/file-up"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/lib/toast"

import { connectFiscalSponsorshipDocumentAsset } from "../actions"
import {
  BUDGET_SUPPORT_ACCEPT,
  formatBudgetDollars,
  getBudgetTotal,
  isCsvFile,
  makeBudgetRow,
  parseBudgetRows,
  parseCsvBudgetRows,
  serializeBudgetRows,
  uploadProjectAsset,
  type FiscalSponsorshipBudgetRow,
} from "../lib/budget-plan"
import type { FiscalSponsorshipApplicationDraft } from "../lib/application-draft"
import type { DraftFieldChange } from "./fiscal-sponsorship-application-editor-controls"

type FiscalSponsorshipBudgetPlanEditorProps = {
  applicationReady: boolean
  draft: FiscalSponsorshipApplicationDraft
  formId: string
  onFieldChange: DraftFieldChange
  projectId: string
}

export function FiscalSponsorshipBudgetPlanEditor({
  applicationReady,
  draft,
  formId,
  onFieldChange,
  projectId,
}: FiscalSponsorshipBudgetPlanEditorProps) {
  const router = useRouter()
  const [selectedSupportFile, setSelectedSupportFile] =
    React.useState<File | null>(null)
  const [rows, setRows] = React.useState(() =>
    parseBudgetRows(draft.expenseSummary)
  )
  const [isUploadPending, startUploadTransition] = React.useTransition()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const lastSerializedRowsRef = React.useRef(draft.expenseSummary)
  const hasLineItemAmounts = rows.some((row) => row.amount.trim())
  const budgetTotal = getBudgetTotal(rows)
  const totalInputId = `${formId}-estimatedBudgetDollars`
  const supportFileInputId = `${formId}-budgetSupportFile`

  React.useEffect(() => {
    if (draft.expenseSummary === lastSerializedRowsRef.current) return
    setRows(parseBudgetRows(draft.expenseSummary))
    lastSerializedRowsRef.current = draft.expenseSummary
  }, [draft.expenseSummary])

  function commitRows(nextRows: FiscalSponsorshipBudgetRow[]) {
    const serializedRows = serializeBudgetRows(nextRows)
    const nextTotal = getBudgetTotal(nextRows)
    setRows(nextRows)
    lastSerializedRowsRef.current = serializedRows
    onFieldChange("expenseSummary", serializedRows)

    if (nextRows.some((row) => row.amount.trim())) {
      onFieldChange(
        "estimatedBudgetDollars",
        nextTotal > 0 ? formatBudgetDollars(nextTotal) : ""
      )
    }
  }

  function handleRowChange({
    field,
    id,
    value,
  }: {
    field: keyof Pick<
      FiscalSponsorshipBudgetRow,
      "amount" | "category" | "description"
    >
    id: string
    value: string
  }) {
    commitRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  function handleAddRow() {
    setRows((currentRows) => [
      ...currentRows,
      makeBudgetRow(currentRows.length, {
        id: `budget-row-new-${Date.now()}`,
      }),
    ])
  }

  function handleRemoveRow(id: string) {
    const nextRows = rows.filter((row) => row.id !== id)
    commitRows(nextRows.length > 0 ? nextRows : [makeBudgetRow(0)])
  }

  async function handleImportCsvRows() {
    const file = selectedSupportFile

    if (!isCsvFile(file)) {
      toast.error("Choose a CSV file to import budget rows.")
      return
    }

    const importedRows = parseCsvBudgetRows(await file.text())
    if (importedRows.length === 0) {
      toast.error("That CSV did not include budget rows.")
      return
    }

    commitRows(importedRows)
    toast.success(
      `Imported ${importedRows.length} budget ${
        importedRows.length === 1 ? "row" : "rows"
      }.`
    )
  }

  function handleUploadSupportFile() {
    if (!applicationReady) {
      toast.error("Save the fiscal application before uploading budget files.")
      return
    }

    if (!selectedSupportFile) {
      toast.error("Choose a budget file to upload.")
      return
    }

    const file = selectedSupportFile
    startUploadTransition(async () => {
      const toastId = toast.loading("Uploading budget support file...")

      try {
        const asset = await uploadProjectAsset({
          description:
            "Budget, expense categories, vendor estimates, or other support for requested project costs.",
          file,
          projectId,
          title: file.name,
        })
        const connected = await connectFiscalSponsorshipDocumentAsset({
          assetId: asset.assetId,
          documentKey: "budget_support",
          projectId,
          title: asset.assetName || file.name,
        })

        if ("error" in connected) {
          toast.error(connected.error, { id: toastId })
          return
        }

        setSelectedSupportFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        toast.success("Budget support file uploaded", { id: toastId })
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to upload that budget file.",
          { id: toastId }
        )
      }
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Field>
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <FieldLabel>Budget plan</FieldLabel>
            <FieldDescription>
              Add line items or import a CSV with category, description, and
              amount columns.
            </FieldDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleAddRow}
          >
            <PlusIcon data-icon="inline-start" aria-hidden />
            Add row
          </Button>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-36">Category</TableHead>
                <TableHead className="min-w-56">Description</TableHead>
                <TableHead className="min-w-32">Amount</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-normal">
                    <Input
                      value={row.category}
                      aria-label="Budget category"
                      placeholder="Program supplies"
                      onChange={(event) =>
                        handleRowChange({
                          field: "category",
                          id: row.id,
                          value: event.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Input
                      value={row.description}
                      aria-label="Budget description"
                      placeholder="Materials, venue, contractors..."
                      onChange={(event) =>
                        handleRowChange({
                          field: "description",
                          id: row.id,
                          value: event.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Input
                      value={row.amount}
                      aria-label="Budget amount"
                      placeholder="$0"
                      inputMode="decimal"
                      onChange={(event) =>
                        handleRowChange({
                          field: "amount",
                          id: row.id,
                          value: event.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove budget row"
                      onClick={() => handleRemoveRow(row.id)}
                    >
                      <Trash2Icon data-icon="inline-start" aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Line-item total</TableCell>
                <TableCell colSpan={2}>
                  {hasLineItemAmounts
                    ? formatBudgetDollars(budgetTotal)
                    : "Add amounts"}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={totalInputId}>Estimated total budget</FieldLabel>
          <Input
            id={totalInputId}
            name="estimatedBudgetDollars"
            value={draft.estimatedBudgetDollars}
            placeholder="$0"
            inputMode="decimal"
            onChange={(event) =>
              onFieldChange("estimatedBudgetDollars", event.target.value)
            }
          />
          <FieldDescription>
            {hasLineItemAmounts
              ? "Updated from the line-item amounts."
              : "Use this when line-item amounts are not known yet."}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor={supportFileInputId}>
            Budget support files
          </FieldLabel>
          <Input
            ref={fileInputRef}
            id={supportFileInputId}
            type="file"
            accept={BUDGET_SUPPORT_ACCEPT}
            onChange={(event) =>
              setSelectedSupportFile(event.target.files?.[0] ?? null)
            }
          />
          <FieldDescription>
            {selectedSupportFile
              ? `${selectedSupportFile.name} selected`
              : "CSV, spreadsheet, PDF, image, and document files are supported."}
          </FieldDescription>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isCsvFile(selectedSupportFile)}
              onClick={() => void handleImportCsvRows()}
            >
              <FileSpreadsheetIcon data-icon="inline-start" aria-hidden />
              Import CSV rows
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                !selectedSupportFile || !applicationReady || isUploadPending
              }
              aria-busy={isUploadPending}
              onClick={handleUploadSupportFile}
            >
              {isUploadPending ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                  aria-hidden
                />
              ) : (
                <FileUpIcon data-icon="inline-start" aria-hidden />
              )}
              Upload support file
            </Button>
          </div>
          {!applicationReady ? (
            <FieldDescription>
              Save the application first to attach budget files for review.
            </FieldDescription>
          ) : null}
        </Field>
      </div>
    </div>
  )
}
