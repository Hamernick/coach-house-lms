"use client"

import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import { createWorkspaceFinanceManualRecord } from "@/actions/workspace-finance"
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

import { WORKSPACE_FINANCE_MANUAL_RECORD_TYPES } from "../lib/record-types"
import type {
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceRecordInput,
} from "../types"

type Props = {
  onClose: () => void
  onRecordCreated: (record: WorkspaceFinanceRecordInput) => void
  programs: WorkspaceFinanceRaisingProgram[]
}

export function WorkspaceFinanceManualRecordDialog({
  onClose,
  onRecordCreated,
  programs,
}: Props) {
  const [initialDate] = useState(getLocalDate)
  const [amount, setAmount] = useState("")
  const [effectiveDate, setEffectiveDate] = useState(initialDate)
  const [error, setError] = useState<string | null>(null)
  const [programId, setProgramId] = useState("organization")
  const [recordType, setRecordType] = useState("donation")
  const [sourceLabel, setSourceLabel] = useState("")
  const [isPending, startTransition] = useTransition()
  const dirty =
    amount !== "" ||
    effectiveDate !== initialDate ||
    programId !== "organization" ||
    recordType !== "donation" ||
    sourceLabel !== ""

  function requestClose() {
    if (isPending) return
    if (!dirty || window.confirm("Discard this record?")) onClose()
  }

  function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createWorkspaceFinanceManualRecord({
        amount,
        effectiveDate,
        programId: programId === "organization" ? null : programId,
        recordType:
          recordType as (typeof WORKSPACE_FINANCE_MANUAL_RECORD_TYPES)[number]["value"],
        sourceLabel,
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      onRecordCreated(result.record)
      toast.success("Finance record added")
      onClose()
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
    >
      <DialogContent
        showCloseButton={!isPending}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-lg"
      >
        <form onSubmit={addRecord} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add record</DialogTitle>
            <DialogDescription>
              Record money that already moved outside Coach House.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="grid-cols-1 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="finance-manual-source">Source</FieldLabel>
              <Input
                id="finance-manual-source"
                name="source"
                autoComplete="off"
                maxLength={120}
                placeholder="Bank, foundation, donor…"
                pattern=".*\S.*"
                title="Enter a source."
                required
                className="h-11 sm:h-9"
                value={sourceLabel}
                onChange={(event) => setSourceLabel(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="finance-manual-type">Type</FieldLabel>
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger
                  id="finance-manual-type"
                  className="h-11 w-full sm:h-9"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {WORKSPACE_FINANCE_MANUAL_RECORD_TYPES.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="py-3 sm:py-1.5"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="finance-manual-program">Program</FieldLabel>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger
                  id="finance-manual-program"
                  className="h-11 w-full sm:h-9"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="organization" className="py-3 sm:py-1.5">
                      Organization-wide
                    </SelectItem>
                  </SelectGroup>
                  {programs.length ? (
                    <SelectGroup>
                      <SelectLabel>Programs</SelectLabel>
                      {programs.map((program) => (
                        <SelectItem
                          key={program.id}
                          value={program.id}
                          className="py-3 sm:py-1.5"
                        >
                          {program.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="finance-manual-date">Date</FieldLabel>
              <Input
                id="finance-manual-date"
                name="effective-date"
                type="date"
                required
                className="h-11 sm:h-9"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="finance-manual-amount">
                Amount (USD)
              </FieldLabel>
              <Input
                id="finance-manual-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                pattern="[0-9]+([.][0-9]{1,2})?"
                title="Enter an amount greater than zero with up to two decimal places."
                required
                className="h-11 sm:h-9"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
          </FieldGroup>

          <p className="text-muted-foreground text-xs leading-5">
            This creates a Recorded item. It does not move money or mark the
            record verified.
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
              className="h-11 sm:h-9"
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="h-11 sm:h-9">
              {isPending ? (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : null}
              {isPending ? "Adding…" : "Add record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getLocalDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}
