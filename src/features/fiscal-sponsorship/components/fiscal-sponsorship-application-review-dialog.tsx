"use client"

import { useEffect, useState } from "react"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { FiscalSponsorshipReviewDecision } from "../types"

type ReviewDecision = Extract<
  FiscalSponsorshipReviewDecision,
  "needs_info" | "declined"
>

export function FiscalSponsorshipApplicationReviewDialog({
  decision,
  onConfirm,
  onOpenChange,
  open,
  pending,
}: {
  decision: ReviewDecision
  onConfirm: (notes: string) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  pending: boolean
}) {
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) setNotes("")
  }, [open])

  const needsInfo = decision === "needs_info"
  const trimmedNotes = notes.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {needsInfo ? "Request more information" : "Decline application"}
          </DialogTitle>
          <DialogDescription>
            {needsInfo
              ? "Tell the applicant exactly what must be updated before they resubmit."
              : "Explain the decision. The applicant will see this note in their fiscal sponsorship workbench."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="fiscal-application-review-note">Review note</Label>
          <Textarea
            id="fiscal-application-review-note"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={
              needsInfo
                ? "List the missing or unclear information…"
                : "Explain why this application cannot move forward…"
            }
            className="min-h-28 resize-y"
            disabled={pending}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={needsInfo ? "default" : "destructive"}
            disabled={pending || !trimmedNotes}
            onClick={() => onConfirm(trimmedNotes)}
          >
            {pending ? (
              <Loader2Icon
                data-icon="inline-start"
                className="animate-spin"
                aria-hidden
              />
            ) : null}
            {needsInfo ? "Send request" : "Decline application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
