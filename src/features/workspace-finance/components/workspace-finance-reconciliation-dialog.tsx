"use client"

import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import type {
  WorkspaceFinanceReconciliationInput,
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceRecordCorrectionResult,
  WorkspaceFinanceRecordInput,
} from "../types"
import { WorkspaceFinanceCorrectionForm } from "./workspace-finance-correction-form"

type Props = {
  amountLabel: string
  dateLabel: string
  onReconciled: (
    recordId: string,
    reconciliation: WorkspaceFinanceReconciliationInput
  ) => void
  onCorrected: (result: WorkspaceFinanceRecordCorrectionResult) => void
  persist: boolean
  programs: WorkspaceFinanceRaisingProgram[]
  record: WorkspaceFinanceRecordInput
}

export function WorkspaceFinanceReconciliationDialog({
  amountLabel,
  dateLabel,
  onCorrected,
  onReconciled,
  persist,
  programs,
  record,
}: Props) {
  const [correcting, setCorrecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState("")
  const [isPending, startTransition] = useTransition()
  const reconciliation = record.reconciliation

  if (!persist || record.status === "draft") {
    return null
  }

  function reset() {
    setError(null)
    setFile(null)
    setReference("")
  }

  function reconcile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError("Choose a PDF, JPG, or PNG as evidence.")
      return
    }

    setError(null)
    startTransition(async () => {
      const form = new FormData()
      form.set("reference", reference)
      form.set("file", file)

      const response = await fetch(
        `/api/account/finance-record-evidence/${record.id}`,
        { method: "POST", body: form }
      )
      const result = (await response.json().catch(() => null)) as {
        error?: string
        reconciliation?: WorkspaceFinanceReconciliationInput
      } | null

      if (!response.ok || !result?.reconciliation) {
        setError(result?.error ?? "Unable to verify this Finance record.")
        return
      }

      onReconciled(record.id, result.reconciliation)
      toast.success("Finance record verified")
      setOpen(false)
      reset()
    })
  }

  const isReconciled = record.status === "reconciled"
  const isCorrected = record.correction?.state === "corrected"
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return
        setOpen(nextOpen)
        if (!nextOpen) {
          setCorrecting(false)
          if (!isReconciled) reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-2.5 font-normal sm:h-7"
        >
          {isCorrected ? "Corrected" : isReconciled ? "Verified" : "Recorded"}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={!isPending}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>
            {correcting
              ? "Correct verified record"
              : isCorrected
                ? "Corrected record"
                : isReconciled
                  ? "Verified record"
                  : "Verify record"}
          </DialogTitle>
          <DialogDescription>
            {correcting
              ? "Create a verified replacement while preserving the original."
              : isCorrected
                ? "This original record was preserved and replaced."
                : isReconciled
                  ? "This record is backed by private external evidence."
                  : "Confirm money recorded outside Coach House with a reference and evidence."}
          </DialogDescription>
        </DialogHeader>

        {!correcting ? (
          <div className="bg-muted/40 rounded-lg px-3 py-2.5 text-sm">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <span className="truncate font-medium">{record.sourceLabel}</span>
              <span className="shrink-0 font-mono tabular-nums">
                {amountLabel}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {record.typeLabel} · {dateLabel}
            </p>
          </div>
        ) : null}

        {correcting ? (
          <WorkspaceFinanceCorrectionForm
            onCancel={() => setCorrecting(false)}
            onCorrected={(result) => {
              onCorrected(result)
              setCorrecting(false)
              setOpen(false)
            }}
            programs={programs}
            record={record}
          />
        ) : isReconciled && reconciliation ? (
          <div className="grid gap-3 text-sm">
            {isCorrected && record.correction ? (
              <div>
                <p className="text-muted-foreground text-xs">Reason</p>
                <p className="mt-0.5 break-words">{record.correction.reason}</p>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground text-xs">Reference</p>
              <p className="mt-0.5 break-words">
                {reconciliation.externalReference}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Evidence</p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-1 max-w-full"
              >
                <a
                  href={`/api/account/finance-record-evidence/${record.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="truncate">{reconciliation.fileName}</span>
                  <ExternalLinkIcon aria-hidden="true" />
                </a>
              </Button>
            </div>
            {!isCorrected ? (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCorrecting(true)}
                >
                  Correct record
                </Button>
              </DialogFooter>
            ) : null}
          </div>
        ) : isReconciled ? (
          <Alert>
            <AlertDescription>
              Verification evidence is temporarily unavailable.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={reconcile} className="grid gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`finance-reference-${record.id}`}>
                  External reference
                </FieldLabel>
                <Input
                  id={`finance-reference-${record.id}`}
                  autoComplete="off"
                  maxLength={160}
                  placeholder="Deposit, receipt, or statement reference"
                  required
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`finance-evidence-${record.id}`}>
                  Evidence
                </FieldLabel>
                <Input
                  id={`finance-evidence-${record.id}`}
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

            <p className="text-muted-foreground text-xs leading-5">
              This confirms an external record. It does not move money.
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
                onClick={() => {
                  setOpen(false)
                  reset()
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <LoaderCircleIcon
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                Mark verified
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
