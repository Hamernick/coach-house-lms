"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AddResource({ onAdd }: { onAdd: (label: string, url: string) => void }) {
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("")
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { onAdd(label, url); setLabel(""); setUrl("") }}>Add resource</Button>
      </div>
    </div>
  )
}

