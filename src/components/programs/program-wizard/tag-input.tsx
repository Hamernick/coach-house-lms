"use client"

import { useCallback, useEffect, useState } from "react"
import X from "lucide-react/dist/esm/icons/x"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TagInputProps = {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  maxTags?: number
  maxLength?: number
}

export function TagInput({ label, values, onChange, placeholder, maxTags, maxLength }: TagInputProps) {
  const [input, setInput] = useState("")

  useEffect(() => {
    if (!maxTags && !maxLength) return
    const nextValues = values
      .map((value) => (typeof maxLength === "number" ? value.slice(0, maxLength) : value))
      .filter(Boolean)
    const limitedValues = typeof maxTags === "number" ? nextValues.slice(0, maxTags) : nextValues
    const changed =
      limitedValues.length !== values.length ||
      limitedValues.some((value, index) => value !== values[index])
    if (changed) {
      onChange(limitedValues)
    }
  }, [maxLength, maxTags, onChange, values])

  const add = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      const nextValue = typeof maxLength === "number" ? trimmed.slice(0, maxLength) : trimmed
      if (typeof maxTags === "number" && values.length >= maxTags) {
        return
      }
      if (!nextValue || values.includes(nextValue)) {
        return
      }
      onChange([...values, nextValue])
      setInput("")
    },
    [maxLength, maxTags, values, onChange],
  )

  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {values.map((tag) => (
          <Badge key={tag} variant="secondary" className="rounded-full px-2 py-0.5 text-xs gap-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== tag))}
              className="ml-1 text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(event) => setInput(event.currentTarget.value)}
        maxLength={typeof maxLength === "number" ? maxLength : undefined}
        disabled={typeof maxTags === "number" ? values.length >= maxTags : false}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault()
            add(input)
          }
          if (event.key === "Backspace" && input === "" && values.length > 0) {
            onChange(values.slice(0, -1))
          }
        }}
        placeholder={placeholder}
      />
    </div>
  )
}
