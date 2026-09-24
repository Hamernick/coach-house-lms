import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CampaignPlanTextarea({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  wide = false,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  maxLength: number
  onChange: (value: string) => void
  wide?: boolean
}) {
  return (
    <div className={`space-y-2 ${wide ? "lg:col-span-2" : ""}`}>
      <Label htmlFor={id}>{label}</Label>
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
    </div>
  )
}
