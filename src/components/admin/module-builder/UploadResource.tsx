"use client"

import { useState, useTransition } from "react"
import { Label } from "@/components/ui/label"

export function UploadResource({
  moduleId,
  onUploaded,
}: {
  moduleId: string
  onUploaded: (label: string, url: string, path: string) => void
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const onSelect = (file: File | null) => {
    if (!file) return
    const fd = new FormData()
    fd.set('file', file)
    start(async () => {
      try {
        const res = await fetch(`/api/admin/modules/${moduleId}/resource`, { method: 'POST', body: fd })
        const json = await res.json().catch(() => ({}) as { url?: string; label?: string; path?: string })
        if (!res.ok) throw new Error(json?.error || 'Upload failed')
        onUploaded(String(json.label || file.name), String(json.url), String(json.path || ''))
        setError(null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      }
    })
  }
  return (
    <div className="rounded-md border p-3 space-y-2">
      <Label>Upload resource</Label>
      <input type="file" onChange={(e) => onSelect(e.currentTarget.files?.[0] ?? null)} disabled={pending} />
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      <p className="text-xs text-muted-foreground">Max 25 MB. Publicly accessible via URL.</p>
    </div>
  )
}

