"use client"

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { WORKSPACE_FINANCE_CSV_RECORD_TYPES } from "../lib/csv-import"
import type { WorkspaceFinanceRaisingProgram } from "../types"

type Props = {
  amountColumn: string
  currencySelection: string
  dateColumn: string
  headers: string[]
  programSelection: string
  programs: WorkspaceFinanceRaisingProgram[]
  recordTypeSelection: string
  setAmountColumn: (value: string) => void
  setCurrencySelection: (value: string) => void
  setDateColumn: (value: string) => void
  setProgramSelection: (value: string) => void
  setRecordTypeSelection: (value: string) => void
  setSourceColumn: (value: string) => void
  sourceColumn: string
}

export function WorkspaceFinanceCsvMappingFields(props: Props) {
  return (
    <FieldGroup className="grid-cols-1 sm:grid-cols-2">
      <ColumnField
        id="finance-csv-date"
        label="Date"
        headers={props.headers}
        value={props.dateColumn}
        onValueChange={props.setDateColumn}
      />
      <ColumnField
        id="finance-csv-amount"
        label="Amount"
        headers={props.headers}
        value={props.amountColumn}
        onValueChange={props.setAmountColumn}
      />
      <ColumnField
        id="finance-csv-source"
        label="Source"
        headers={props.headers}
        value={props.sourceColumn}
        onValueChange={props.setSourceColumn}
      />
      <RecordTypeField
        headers={props.headers}
        value={props.recordTypeSelection}
        onValueChange={props.setRecordTypeSelection}
      />
      <CurrencyField
        headers={props.headers}
        value={props.currencySelection}
        onValueChange={props.setCurrencySelection}
      />
      <ProgramField
        programs={props.programs}
        value={props.programSelection}
        onValueChange={props.setProgramSelection}
      />
    </FieldGroup>
  )
}

function ProgramField({
  onValueChange,
  programs,
  value,
}: {
  onValueChange: (value: string) => void
  programs: WorkspaceFinanceRaisingProgram[]
  value: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor="finance-csv-program">Program</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="finance-csv-program" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="organization">Organization-wide</SelectItem>
          </SelectGroup>
          {programs.length ? (
            <SelectGroup>
              <SelectLabel>Apply to every record</SelectLabel>
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
  )
}

function ColumnField({
  headers,
  id,
  label,
  onValueChange,
  value,
}: {
  headers: string[]
  id: string
  label: string
  onValueChange: (value: string) => void
  value: string
}) {
  return (
    <Field data-invalid={!value || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} size="sm" aria-invalid={!value || undefined}>
          <SelectValue placeholder="Choose column" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {headers.map((header) => (
              <SelectItem key={header} value={header}>
                {header}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function RecordTypeField({
  headers,
  onValueChange,
  value,
}: {
  headers: string[]
  onValueChange: (value: string) => void
  value: string
}) {
  return (
    <Field data-invalid={!value || undefined}>
      <FieldLabel htmlFor="finance-csv-type">Record type</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id="finance-csv-type"
          size="sm"
          aria-invalid={!value || undefined}
        >
          <SelectValue placeholder="Choose type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Apply to every record</SelectLabel>
            {WORKSPACE_FINANCE_CSV_RECORD_TYPES.map(
              ({ label, value: type }) => (
                <SelectItem key={type} value={`fixed:${type}`}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Use a CSV column</SelectLabel>
            {headers.map((header) => (
              <SelectItem key={header} value={`column:${header}`}>
                {header}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function CurrencyField({
  headers,
  onValueChange,
  value,
}: {
  headers: string[]
  onValueChange: (value: string) => void
  value: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor="finance-csv-currency">Currency</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="finance-csv-currency" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="fixed:USD">USD</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Use a CSV column</SelectLabel>
            {headers.map((header) => (
              <SelectItem key={header} value={`column:${header}`}>
                {header}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}
