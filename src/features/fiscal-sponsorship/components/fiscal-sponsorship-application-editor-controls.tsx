"use client"

import * as React from "react"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"

import { Badge } from "@/components/ui/badge"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  FISCAL_SPONSORSHIP_BOOLEAN_OPTIONS,
  type FiscalSponsorshipApplicationDraft,
  type FiscalSponsorshipBooleanChoice,
} from "../lib/application-draft"

export const EMPTY_SELECT_VALUE = "not_set"

const FISCAL_APPLICATION_SECTION_ROW_CLASSNAME =
  "group rounded-2xl border border-transparent transition-[background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
const FISCAL_APPLICATION_SECTION_TRIGGER_CLASSNAME =
  "flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left outline-none transition-[background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-2 motion-reduce:transition-none"
const FISCAL_APPLICATION_SECTION_BODY_CLASSNAME =
  "grid transition-[grid-template-rows,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"

export type EditorSectionChromeProps = {
  complete: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export type DraftFieldChange = <
  Key extends keyof FiscalSponsorshipApplicationDraft,
>(
  field: Key,
  value: FiscalSponsorshipApplicationDraft[Key]
) => void

export function EditorSection({
  children,
  complete,
  description,
  onOpenChange,
  open,
  title,
}: {
  children: React.ReactNode
  complete: boolean
  description: string
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}) {
  const bodyId = React.useId()
  const StatusIcon = complete ? CheckCircle2Icon : CircleDashedIcon

  return (
    <FieldSet
      data-state={open ? "open" : "closed"}
      className={cn(
        "border-border/60 bg-muted/25 gap-0 overflow-visible rounded-2xl border p-0",
        FISCAL_APPLICATION_SECTION_ROW_CLASSNAME,
        complete && "bg-muted/45"
      )}
    >
      <FieldLegend className="sr-only">{title}</FieldLegend>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        className={FISCAL_APPLICATION_SECTION_TRIGGER_CLASSNAME}
        onClick={() => onOpenChange(!open)}
      >
        <span
          className={cn(
            "text-muted-foreground mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full",
            (complete || open) && "bg-primary/10 text-primary"
          )}
          aria-hidden
        >
          <StatusIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-foreground min-w-0 truncate text-sm font-semibold">
              {title}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-7 max-w-full overflow-visible rounded-full border-transparent px-2.5 py-1 leading-none transition-[background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                complete
                  ? "bg-emerald-500/10 text-emerald-700 group-focus-within:bg-emerald-500/15 group-focus-within:text-emerald-800 group-hover:bg-emerald-500/15 group-hover:text-emerald-800 dark:text-emerald-300 dark:group-focus-within:text-emerald-200 dark:group-hover:text-emerald-200"
                  : "bg-amber-500/10 text-amber-700 group-focus-within:bg-amber-500/15 group-focus-within:text-amber-800 group-hover:bg-amber-500/15 group-hover:text-amber-800 dark:text-amber-300 dark:group-focus-within:text-amber-200 dark:group-hover:text-amber-200"
              )}
            >
              {complete ? "Complete" : "Needed"}
            </Badge>
          </span>
          <span className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">
            {description}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "text-muted-foreground mt-1 size-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={bodyId}
        aria-hidden={!open}
        className={cn(
          FISCAL_APPLICATION_SECTION_BODY_CLASSNAME,
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <FieldGroup
            className={cn(
              "gap-4 px-4 pb-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              open ? "translate-y-0" : "-translate-y-1"
            )}
          >
            {children}
          </FieldGroup>
        </div>
      </div>
    </FieldSet>
  )
}

export function DraftInputField<
  Key extends keyof FiscalSponsorshipApplicationDraft,
>({
  autoComplete,
  field,
  formId,
  inputMode,
  label,
  onFieldChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete?: string
  field: Key
  formId: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  label: string
  onFieldChange: DraftFieldChange
  placeholder?: string
  type?: string
  value: string
}) {
  const inputId = `${formId}-${String(field)}`

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        id={inputId}
        name={String(field)}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onFieldChange(field, event.target.value as never)}
      />
    </Field>
  )
}

export function DraftTextareaField<
  Key extends keyof FiscalSponsorshipApplicationDraft,
>({
  description,
  field,
  formId,
  label,
  onFieldChange,
  placeholder,
  value,
}: {
  description?: string
  field: Key
  formId: string
  label: string
  onFieldChange: DraftFieldChange
  placeholder?: string
  value: string
}) {
  const inputId = `${formId}-${String(field)}`

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Textarea
        id={inputId}
        name={String(field)}
        value={value}
        placeholder={placeholder}
        className="min-h-24 resize-y"
        onChange={(event) => onFieldChange(field, event.target.value as never)}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}

export function SelectField({
  description,
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  description?: string
  label: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
  value: string
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}

export function BooleanField({
  description,
  field,
  label,
  onFieldChange,
  value,
}: {
  description?: string
  field: keyof Pick<
    FiscalSponsorshipApplicationDraft,
    | "legalEntityHas501c3"
    | "operatesOutsideUnitedStates"
    | "receivesInvestorReturnFunds"
    | "engagesInLobbying"
    | "hasLegalComplianceFinancialConcerns"
  >
  label: string
  onFieldChange: DraftFieldChange
  value: FiscalSponsorshipBooleanChoice
}) {
  return (
    <SelectField
      label={label}
      value={value}
      placeholder="Choose..."
      options={FISCAL_SPONSORSHIP_BOOLEAN_OPTIONS}
      description={description}
      onValueChange={(nextValue) =>
        onFieldChange(field, nextValue as FiscalSponsorshipBooleanChoice)
      }
    />
  )
}
