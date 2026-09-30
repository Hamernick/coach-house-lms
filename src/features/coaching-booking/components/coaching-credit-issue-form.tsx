"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  COACHING_CREDIT_SOURCES,
  type CoachingCreditPanelData,
  type CoachingCreditSource,
  type IssueCreditsAction,
} from "../credit-types"

export function CoachingCreditIssueForm({
  orgId,
  userId,
  issueAction,
  onIssued,
  onPendingChange,
}: {
  orgId: string
  userId: string
  issueAction: IssueCreditsAction
  onIssued: (data: CoachingCreditPanelData) => void
  onPendingChange: (pending: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [source, setSource] = useState<CoachingCreditSource>("courtesy")
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef<string | null>(null)
  const id = `credit-${userId}`
  return (
    <form
      className="space-y-3"
      onChange={() => {
        requestId.current = null
      }}
      onSubmit={(event) => {
        event.preventDefault()
        const form = event.currentTarget
        const values = new FormData(form)
        const expiration = String(values.get("expiration") ?? "")
        requestId.current ??= crypto.randomUUID()
        const request = requestId.current
        onPendingChange(true)
        startTransition(async () => {
          setError(null)
          try {
            const result = await issueAction({
              orgId,
              userId,
              requestId: request,
              quantity: Number(values.get("quantity")),
              source,
              label: String(
                values.get("label") || COACHING_CREDIT_SOURCES[source]
              ),
              reason: String(values.get("reason") ?? ""),
              expiresAt: expiration
                ? new Date(`${expiration}T23:59:59.999`).toISOString()
                : null,
            })
            if (!result.ok) {
              setError(result.error)
              return
            }
            onIssued(result.data)
            requestId.current = null
            form.reset()
            toast.success("Coaching credits added.")
          } catch {
            setError(
              "Unable to save. Retry to check this credit request without issuing it twice."
            )
          } finally {
            onPendingChange(false)
          }
        })
      }}
    >
      <fieldset disabled={pending} className="space-y-3">
        <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
          <div className="space-y-1">
            <Label htmlFor={`${id}-quantity`}>Quantity</Label>
            <Input
              id={`${id}-quantity`}
              name="quantity"
              type="number"
              min={1}
              max={10000}
              step={1}
              defaultValue={1}
              required
            />
          </div>
          <div className="min-w-0 space-y-1">
            <Label htmlFor={`${id}-source`}>Source</Label>
            <Select
              value={source}
              onValueChange={(value) => {
                setSource(value as CoachingCreditSource)
                requestId.current = null
              }}
            >
              <SelectTrigger id={`${id}-source`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COACHING_CREDIT_SOURCES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-label`}>Label (optional)</Label>
          <Input
            id={`${id}-label`}
            name="label"
            maxLength={160}
            placeholder={COACHING_CREDIT_SOURCES[source]}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-reason`}>Reason</Label>
          <Textarea
            id={`${id}-reason`}
            name="reason"
            required
            maxLength={1000}
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-expiration`}>Expires (optional)</Label>
          <Input id={`${id}-expiration`} name="expiration" type="date" />
          <p className="text-muted-foreground text-xs">
            Available through this date in your local time.
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="sm" className="w-full" disabled={pending}>
          {pending ? "Adding credits…" : "Add credits"}
        </Button>
      </fieldset>
    </form>
  )
}
