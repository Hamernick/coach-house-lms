"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function AddHomework({ onAdd }: { onAdd: (label: string, instructions: string, uploadRequired: boolean) => void }) {
  const [label, setLabel] = useState("")
  const [instructions, setInstructions] = useState("")
  const [upload, setUpload] = useState(false)
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="space-y-1">
        <Label>Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="min-h-20" />
      </div>
      <div className="flex items-center justify-between rounded-md border p-2">
        <span className="text-xs">Upload required</span>
        <input type="checkbox" checked={upload} onChange={(e) => setUpload(e.target.checked)} />
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { onAdd(label, instructions, upload); setLabel(""); setInstructions(""); setUpload(false) }}>Add homework</Button>
      </div>
    </div>
  )
}

