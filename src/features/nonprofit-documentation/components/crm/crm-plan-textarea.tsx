import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function CrmPlanTextarea({
  id,
  label,
  description,
  value,
  placeholder,
  maxLength,
  onChange,
  wide = false,
}: {
  id: string
  label: string
  description?: string
  value: string
  placeholder: string
  maxLength: number
  onChange: (value: string) => void
  wide?: boolean
}) {
  return (
    <Field className={wide ? "lg:col-span-2" : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <Textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={4}
        placeholder={placeholder}
        className="min-h-28 resize-y text-sm"
      />
    </Field>
  )
}
