import type { FormFieldType, SliderRange } from "./types"

export const DEFAULT_SLIDER_RANGE: SliderRange = { min: 0, max: 100, step: 1 }

export const FORM_FIELD_TYPE_OPTIONS: Array<{ value: FormFieldType; label: string }> = [
  { value: "short_text", label: "Short text input" },
  { value: "long_text", label: "Long text area" },
  { value: "select", label: "Select dropdown" },
  { value: "multi_select", label: "Multi-select" },
  { value: "slider", label: "Slider" },
  { value: "subtitle", label: "Subtitle / section heading" },
  { value: "custom_program", label: "Custom program builder" },
]

// Class-level additional resources limit for Landing step
export const MAX_CLASS_LINKS = 3
