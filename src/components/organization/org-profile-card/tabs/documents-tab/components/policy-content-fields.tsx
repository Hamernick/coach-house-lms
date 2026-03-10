"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { PolicyDraft } from "../types"

type PolicyContentFieldsProps = {
  draft: PolicyDraft
  onChange: (nextDraft: PolicyDraft) => void
}

export function PolicyContentFields({ draft, onChange }: PolicyContentFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="policy-title">Policy title</Label>
        <Input
          id="policy-title"
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          placeholder="Example: Data privacy policy"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="policy-summary">Summary</Label>
        <Textarea
          id="policy-summary"
          value={draft.summary}
          onChange={(event) => onChange({ ...draft, summary: event.target.value })}
          placeholder="Short description of scope, ownership, and implementation status."
          rows={4}
        />
      </div>
    </>
  )
}
