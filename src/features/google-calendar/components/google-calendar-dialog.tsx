"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { getReactGrabLinkedSurfaceProps } from "@/components/dev/react-grab-surface"
import type { CalendarController } from "../hooks/use-google-calendar-controller"
import { calendarErrorMessage } from "../lib"
import { GoogleCalendarSettings } from "./google-calendar-settings"

export function GoogleCalendarDialog({
  open,
  onOpenChange,
  controller,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  controller: CalendarController
}) {
  const { summary, error, pending, perform } = controller
  const [disconnecting, setDisconnecting] = useState(false)
  const [settingsKey, setSettingsKey] = useState(0)
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          setDisconnecting(false)
          onOpenChange(value)
        }
      }}
    >
      <DialogContent
        className="max-h-[85svh] overflow-y-auto overscroll-contain sm:max-w-md"
        {...getReactGrabLinkedSurfaceProps({
          ownerId: "google-calendar:connection",
          component: "GoogleCalendarDialog",
          source:
            "src/features/google-calendar/components/google-calendar-dialog.tsx",
          slot: "dialog",
          surfaceKind: "content",
        })}
      >
        <DialogHeader>
          <DialogTitle>Google Calendar</DialogTitle>
          <DialogDescription>
            {summary?.email ?? "Bring your schedule into Coach House."}
          </DialogDescription>
        </DialogHeader>
        {error || summary?.error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {error ?? calendarErrorMessage(summary?.error ?? "")}
            </AlertDescription>
          </Alert>
        ) : null}
        {!summary ? (
          <Button variant="outline" onClick={() => void controller.refresh()}>
            Retry connection status
          </Button>
        ) : !summary.configured ? (
          <>
            <p className="text-muted-foreground text-sm">
              {calendarErrorMessage("not_configured")}
              {" Your Google login and Drive connection are separate."}
            </p>
            <Button variant="outline" onClick={() => void controller.refresh()}>
              Check again
            </Button>
          </>
        ) : !summary.connected ? (
          <>
            <p className="text-muted-foreground text-sm">
              Choose which Google calendars appear here. Personal events remain
              visible only to you. Board export is optional.
            </p>
            <Button disabled={pending} onClick={() => void perform("connect")}>
              {pending
                ? "Connecting…"
                : summary.status === "reconnect_required"
                  ? "Reconnect Google Calendar"
                  : "Continue with Google"}
            </Button>
          </>
        ) : disconnecting ? (
          <>
            <p className="text-sm">
              Disconnect Google Calendar? Sync will stop and imported events
              will be removed from Coach House. Existing Google events remain.
              Drive and Google login stay connected.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => setDisconnecting(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={async () => {
                  if (await perform("disconnect")) {
                    setDisconnecting(false)
                    onOpenChange(false)
                  }
                }}
              >
                {pending ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Field
              orientation="horizontal"
              className="grid-cols-[minmax(0,1fr)_auto] items-center"
            >
              <div className="flex flex-1 flex-col gap-1">
                <FieldLabel htmlFor="google-calendar-sync">
                  Calendar sync
                </FieldLabel>
                <FieldDescription>
                  {summary.enabled
                    ? "Selected calendars and board events sync automatically."
                    : "Off. Your selections are saved; Google events are hidden here."}
                </FieldDescription>
              </div>
              <Switch
                id="google-calendar-sync"
                checked={summary.enabled}
                disabled={pending}
                onCheckedChange={(enabled) =>
                  void perform("enabled", { enabled })
                }
              />
            </Field>
            <GoogleCalendarSettings
              key={settingsKey}
              controller={controller}
              onSaved={() => setSettingsKey((value) => value + 1)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={pending || !summary.enabled}
                onClick={() => void perform("sync")}
              >
                {pending || summary.syncing ? "Syncing…" : "Sync now"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => setDisconnecting(true)}
              >
                Disconnect
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              <a
                href="https://myaccount.google.com/connections"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                Manage Google permissions
              </a>
              {
                ". Removing Coach House there affects all its Google connections."
              }
            </p>
            <p className="text-muted-foreground text-xs" aria-live="polite">
              {summary.lastSyncedAt
                ? "Last synced " +
                  new Date(summary.lastSyncedAt).toLocaleString()
                : "No completed sync yet."}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
