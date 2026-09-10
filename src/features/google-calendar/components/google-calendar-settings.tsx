"use client"
import { useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  calendarClientRequest,
  type CalendarController,
} from "../hooks/use-google-calendar-controller"
import type { CalendarChoice } from "../types"

export function GoogleCalendarSettings({
  controller,
  onSaved,
}: {
  controller: CalendarController
  onSaved: () => void
}) {
  const { summary, pending, perform } = controller
  const [expectedOrgId] = useState(summary?.activeOrgId)
  const [choices, setChoices] = useState<CalendarChoice[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(
    () => summary?.selectedCalendars.map((calendar) => calendar.id) ?? []
  )
  const [exportBoard, setExportBoard] = useState(
    summary?.exportOrgId === summary?.activeOrgId &&
      Boolean(summary?.exportOrgId)
  )
  const id = useId()
  const load = () => {
    setError(null)
    return calendarClientRequest<{ calendars: CalendarChoice[] }>("calendars")
  }
  useEffect(() => {
    let alive = true
    load()
      .then((result) => {
        if (alive) setChoices(result.calendars)
      })
      .catch((cause) => {
        if (alive) setError(cause.message)
      })
    return () => {
      alive = false
    }
  }, [])
  if (!summary) return null
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        if (
          await perform("settings", {
            calendarIds: selected,
            expectedOrgId,
            exportBoard,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          })
        ) {
          onSaved()
          void perform("sync")
        }
      }}
      className="flex flex-col gap-4"
    >
      {expectedOrgId !== summary.activeOrgId ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            Your workspace changed. Reopen Calendar settings before saving.
          </AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Calendars to display</FieldLegend>
          <FieldDescription>
            Only you can see these events in Coach House. Choose up to five.
          </FieldDescription>
          {!choices && !error ? <Skeleton className="h-16 w-full" /> : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void load()
                    .then((result) => setChoices(result.calendars))
                    .catch((cause) => setError(cause.message))
                }}
              >
                Try again
              </Button>
            </Alert>
          ) : null}
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto overscroll-contain">
            {choices?.map((calendar, index) => (
              <Field
                orientation="horizontal"
                key={calendar.id}
                className="grid-cols-[auto_minmax(0,1fr)] items-center"
              >
                <Checkbox
                  id={id + index}
                  checked={selected.includes(calendar.id)}
                  disabled={
                    pending ||
                    (!selected.includes(calendar.id) && selected.length >= 5)
                  }
                  onCheckedChange={(checked) =>
                    setSelected((previous) =>
                      checked === true
                        ? [...previous, calendar.id]
                        : previous.filter((value) => value !== calendar.id)
                    )
                  }
                />
                <FieldLabel
                  htmlFor={id + index}
                  className="flex min-h-10 min-w-0 items-center break-words"
                >
                  {calendar.name}
                </FieldLabel>
              </Field>
            ))}
            {choices?.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No calendars available to display.
              </p>
            ) : null}
          </div>
        </FieldSet>
        <Field
          orientation="horizontal"
          className="grid-cols-[auto_minmax(0,1fr)]"
        >
          <Checkbox
            id={id + "-export"}
            checked={exportBoard}
            disabled={pending || !summary.canExport}
            onCheckedChange={(checked) => setExportBoard(checked === true)}
          />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={id + "-export"}>
              Export this workspace’s board events
            </FieldLabel>
            <FieldDescription>
              Create a separate Coach House calendar in Google. Edit board
              events in Coach House.
            </FieldDescription>
            {summary.exportOrgId &&
            summary.exportOrgId !== summary.activeOrgId ? (
              <FieldDescription>
                Saving replaces the board export from your other workspace.
                Existing Google events remain.
              </FieldDescription>
            ) : null}
          </div>
        </Field>
        {!summary.canExport ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void perform("connect")}
          >
            Allow board export
          </Button>
        ) : null}
      </FieldGroup>
      <Button
        type="submit"
        disabled={
          pending ||
          expectedOrgId !== summary.activeOrgId ||
          !choices ||
          (!selected.length && !exportBoard)
        }
      >
        {pending ? "Saving…" : "Save and sync"}
      </Button>
    </form>
  )
}
