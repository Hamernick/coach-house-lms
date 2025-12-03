"use client"

import { useCallback, useState } from "react"
import X from "lucide-react/dist/esm/icons/x"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TagInputProps = {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export function TagInput({ label, values, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("")

  const add = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed || values.includes(trimmed)) {
        return
      }
      onChange([...values, trimmed])
      setInput("")
    },
    [values, onChange],
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
