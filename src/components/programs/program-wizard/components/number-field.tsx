import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type NumberFieldProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  error?: string
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  error,
}: NumberFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.currentTarget.value || "0"))}
        className="text-base"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
