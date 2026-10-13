"use client"

import { useEffect, useMemo, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function AssignmentEditor({
  moduleId,
  initialSchema,
  initialCompleteOnSubmit,
  onSave,
}: {
  moduleId: string
  initialSchema: Record<string, unknown> | null
  initialCompleteOnSubmit: boolean
  onSave: (fd: FormData) => Promise<void>
}) {
  const [jsonText, setJsonText] = useState(
    JSON.stringify(initialSchema ?? { fields: [] }, null, 2)
  )
  const [autoComplete, setAutoComplete] = useState(initialCompleteOnSubmit)
  const [pending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced autosave
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(() => {
      const fd = new FormData()
      fd.set("moduleId", moduleId)
      fd.set("schema", jsonText)
      fd.set("completeOnSubmit", autoComplete ? "true" : "false")
      startTransition(async () => {
        try {
          await onSave(fd)
          setError(null)
          setDirty(false)
        } catch {
          setError("Failed to save assignment")
        }
      })
    }, 500)
    return () => clearTimeout(t)
  }, [moduleId, jsonText, autoComplete, dirty, onSave])

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const fd = new FormData()
    fd.set("moduleId", moduleId)
    fd.set("schema", jsonText)
    fd.set("completeOnSubmit", autoComplete ? "true" : "false")
    startTransition(async () => {
      try {
        await onSave(fd)
        setError(null)
        setDirty(false)
      } catch {
        setError("Failed to save assignment")
      }
    })
  }

  const valid = useMemo(() => {
    try {
      const obj = JSON.parse(jsonText)
      return obj && typeof obj === "object"
    } catch {
      return false
    }
  }, [jsonText])

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="assignment-schema">Schema (JSON)</Label>
        <Textarea
          id="assignment-schema"
          value={jsonText}
          onChange={(ev) => {
            setJsonText(ev.target.value)
            setDirty(true)
          }}
          className="min-h-40 font-mono text-xs"
        />
        {!valid ? (
          <p className="text-xs text-amber-500">Invalid JSON</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="completeOnSubmit"
          checked={autoComplete}
          onCheckedChange={(checked) => {
            setAutoComplete(Boolean(checked))
            setDirty(true)
          }}
        />
        <Label htmlFor="completeOnSubmit">Mark module complete on submit</Label>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || !valid}>
          Save
        </Button>
        {pending ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      </div>
    </form>
  )
}
