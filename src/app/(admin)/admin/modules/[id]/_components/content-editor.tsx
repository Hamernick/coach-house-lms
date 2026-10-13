"use client"

import { useEffect, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { VideoSignedUrlHelper } from "./signed-url-helper"
import { Textarea } from "@/components/ui/textarea"

export function ContentEditor({
  moduleId,
  initialTranscript,
  initialInteractions,
  initialResources,
  initialHomework,
  initialAdminNotes,
  onSave,
  onCreate,
}: {
  moduleId: string
  initialTranscript: string
  initialInteractions: unknown[]
  initialResources: unknown[]
  initialHomework: unknown[]
  initialAdminNotes: string
  onSave: (fd: FormData) => Promise<void>
  onCreate: (bucket: string, path: string) => Promise<string>
}) {
  const [transcript, setTranscript] = useState(initialTranscript)
  const [interactions, setInteractions] = useState(JSON.stringify(initialInteractions ?? [], null, 2))
  const [resources, setResources] = useState(JSON.stringify(initialResources ?? [], null, 2))
  const [homework, setHomework] = useState(JSON.stringify(initialHomework ?? [], null, 2))
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSaved(false)
  }, [transcript, interactions, resources, homework, adminNotes])

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const fd = new FormData()
    fd.set("moduleId", moduleId)
    fd.set("transcript", transcript)
    fd.set("interactions", interactions)
    fd.set("resources", resources)
    fd.set("homework", homework)
    fd.set("adminNotes", adminNotes)
    startTransition(async () => {
      try {
        await onSave(fd)
        setSaved(true)
        setError(null)
      } catch {
        setError("Failed to save content.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transcript">Transcript</Label>
        <Textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} className="min-h-24" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="interactions">Interactions (JSON array)</Label>
        <Textarea id="interactions" value={interactions} onChange={(e) => setInteractions(e.target.value)} className="min-h-32 font-mono text-xs" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resources">Resources (JSON array of {`{label,url}`})</Label>
        <Textarea id="resources" value={resources} onChange={(e) => setResources(e.target.value)} className="min-h-32 font-mono text-xs" />
        <div className="mt-2">
          <VideoSignedUrlHelper onCreate={onCreate} onGenerate={(url) => {
            try {
              const arr = JSON.parse(resources)
              const list = Array.isArray(arr) ? arr : []
              const name = url.split('?')[0].split('/').pop() || 'File'
              const next = [...list, { label: name, url }]
              setResources(JSON.stringify(next, null, 2))
            } catch {
              const name = url.split('?')[0].split('/').pop() || 'File'
              const next = [{ label: name, url }]
              setResources(JSON.stringify(next, null, 2))
            }
          }} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="homework">Homework (JSON array)</Label>
        <Textarea id="homework" value={homework} onChange={(e) => setHomework(e.target.value)} className="min-h-32 font-mono text-xs" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-notes">Admin notes</Label>
        <Textarea id="admin-notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="min-h-24" />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>Save content</Button>
        {saved ? <p className="text-xs text-muted-foreground">Saved</p> : null}
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      </div>
    </form>
  )
}
