"use client"
import { Textarea } from "@/components/ui/textarea"
import { COACHING_ATTENDEE_NOTES_MAX_LENGTH } from "../types"

export function SessionNotesField({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div data-booking-notes-field="true" className="mt-1.5 flex flex-col gap-2">
      <label
        htmlFor="coaching-session-notes"
        className="text-foreground text-sm font-medium"
      >
        Notes
      </label>
      <Textarea
        id="coaching-session-notes"
        name="attendee-notes"
        value={value}
        maxLength={COACHING_ATTENDEE_NOTES_MAX_LENGTH}
        placeholder="Share priorities, questions, or context for the meeting…"
        className="min-h-24 resize-none"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
