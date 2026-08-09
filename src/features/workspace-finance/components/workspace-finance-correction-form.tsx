"use client"

import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  getWorkspaceFinanceRecordType,
  WORKSPACE_FINANCE_MANUAL_RECORD_TYPES,
} from "../lib/record-types"
import type {
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceRecordCorrectionResult,
  WorkspaceFinanceRecordInput,
} from "../types"

type Props = {
  onCancel: () => void
  onCorrected: (result: WorkspaceFinanceRecordCorrectionResult) => void
  programs: WorkspaceFinanceRaisingProgram[]
  record: WorkspaceFinanceRecordInput
}

export function WorkspaceFinanceCorrectionForm({
  onCancel,
  onCorrected,
  programs,
  record,
}: Props) {
  const initialType = getInitialType(record.recordType)
  const [amount, setAmount] = useState(formatAmount(record.amountCents))
  const [effectiveDate, setEffectiveDate] = useState(
    record.effectiveAt.slice(0, 10)
  )
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [programId, setProgramId] = useState(record.programId ?? "organization")
  const [reason, setReason] = useState("")
  const [recordType, setRecordType] = useState(initialType)
  const [reference, setReference] = useState("")
  const [sourceLabel, setSourceLabel] = useState(record.sourceLabel)
  const [isPending, startTransition] = useTransition()

  function correctRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError("Choose a PDF, JPG, or PNG as evidence.")
      return
    }

    setError(null)
    startTransition(async () => {
      const form = new FormData()
      form.set("amount", amount)
      form.set("effectiveDate", effectiveDate)
      form.set("file", file)
      form.set("programId", programId === "organization" ? "" : programId)
      form.set("reason", reason)
      form.set("recordType", recordType)
      form.set("reference", reference)
      form.set("sourceLabel", sourceLabel)

      try {
        const response = await fetch(
          `/api/account/finance-record-evidence/${record.id}`,
          { method: "PATCH", body: form }
        )
        const payload = (await response.json().catch(() => null)) as {
          correction?: WorkspaceFinanceRecordCorrectionResult
          error?: string
        } | null

        if (!response.ok || !payload?.correction) {
          setError(payload?.error ?? "Unable to correct this Finance record.")
          return
        }

        onCorrected(payload.correction)
        toast.success("Finance record corrected")
      } catch {
        setError("Unable to correct this Finance record.")
      }
    })
  }

  return (
    <form onSubmit={correctRecord} className="grid gap-4">
      <p className="text-muted-foreground text-xs leading-5">
        The original stays in History. This replacement updates displayed totals
        and does not move money.
      </p>

      <FieldGroup className="grid-cols-1 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`finance-correction-reason-${record.id}`}>
            Reason
          </FieldLabel>
          <Input
            id={`finance-correction-reason-${record.id}`}
            autoComplete="off"
            maxLength={300}
            placeholder="What needs to change?"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`finance-correction-source-${record.id}`}>
            Source
          </FieldLabel>
          <Input
            id={`finance-correction-source-${record.id}`}
            autoComplete="off"
            maxLength={120}
            required
            value={sourceLabel}
            onChange={(event) => setSourceLabel(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`finance-correction-type-${record.id}`}>
            Type
          </FieldLabel>
          <Select value={recordType} onValueChange={setRecordType}>
            <SelectTrigger
              id={`finance-correction-type-${record.id}`}
              className="h-11 w-full sm:h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {WORKSPACE_FINANCE_MANUAL_RECORD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`finance-correction-program-${record.id}`}>
            Program
          </FieldLabel>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger
              id={`finance-correction-program-${record.id}`}
              className="h-11 w-full sm:h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="organization">Organization-wide</SelectItem>
              </SelectGroup>
              {programs.length ? (
                <SelectGroup>
                  <SelectLabel>Programs</SelectLabel>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`finance-correction-date-${record.id}`}>
            Date
          </FieldLabel>
          <Input
            id={`finance-correction-date-${record.id}`}
            type="date"
            required
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`finance-correction-amount-${record.id}`}>
            Amount (USD)
          </FieldLabel>
          <Input
            id={`finance-correction-amount-${record.id}`}
            inputMode="decimal"
            pattern="[0-9]+([.][0-9]{1,2})?"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`finance-correction-reference-${record.id}`}>
            External reference
          </FieldLabel>
          <Input
            id={`finance-correction-reference-${record.id}`}
            autoComplete="off"
            maxLength={160}
            placeholder="Deposit, receipt, or statement reference"
            required
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`finance-correction-evidence-${record.id}`}>
            Evidence
          </FieldLabel>
          <Input
            id={`finance-correction-evidence-${record.id}`}
            type="file"
            accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
            required
            onChange={(event) =>
              setFile(event.currentTarget.files?.[0] ?? null)
            }
          />
          <p className="text-muted-foreground text-xs">
            PDF, JPG, or PNG up to 10 MB. Stored privately.
          </p>
        </Field>
      </FieldGroup>

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
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircleIcon
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : null}
          {isPending ? "Saving…" : "Save correction"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function formatAmount(amountCents: number | null | undefined) {
  return typeof amountCents === "number" ? (amountCents / 100).toFixed(2) : ""
}

function getInitialType(recordType: string | null | undefined) {
  const type = recordType ? getWorkspaceFinanceRecordType(recordType) : null
  return type?.manual ? type.value : "other_income"
}
