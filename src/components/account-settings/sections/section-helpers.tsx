import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const STAGE_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "prototype", label: "Prototype" },
  { value: "pilot", label: "Pilot" },
  { value: "early", label: "Early" },
  { value: "scaling", label: "Scaling" },
  { value: "established", label: "Established" },
]

export function OrganizationStageSelect({
  id,
  value,
  onChange,
  ariaInvalid,
}: {
  id?: string
  value: string
  onChange: (val: string) => void
  ariaInvalid?: boolean
}) {
  const known = STAGE_OPTIONS.some((option) => option.value === value)
  const controlledValue = value || undefined

  return (
    <Select value={controlledValue} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid}>
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent>
        {STAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {!known && value ? <SelectItem value={value}>{value}</SelectItem> : null}
      </SelectContent>
    </Select>
  )
}

export function SideLink({
  label,
  active,
  onClick,
  danger = false,
}: {
  label: string
  active: boolean
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : danger
            ? "text-destructive hover:bg-destructive/10"
            : "hover:bg-accent",
      )}
    >
      {label}
    </button>
  )
}

export { STAGE_OPTIONS }
