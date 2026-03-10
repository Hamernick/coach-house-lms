"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

import {
  QA_AUTOFILL_ALLOWED_EMAILS,
  QA_AUTOFILL_FIRST_USE_ACK_KEY,
  QA_AUTOFILL_TOKEN_KEY,
  captureAutofillSnapshot,
  ensurePeopleAddSheetOpen,
  fillPeopleAddSheet,
  fillVisibleControls,
  normalize,
  restoreAutofillSnapshot,
  type AutofillSnapshot,
} from "./case-study-autofill-fab/helpers"

export function CaseStudyAutofillFab({
  userEmail,
  allowToken = false,
  className,
}: {
  userEmail?: string | null
  allowToken?: boolean
  className?: string
}) {
  const pathname = usePathname()
  const [pending, setPending] = useState(false)
  const [tokenAllowed, setTokenAllowed] = useState(false)
  const [localDevAllowed, setLocalDevAllowed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [firstUseAcknowledged, setFirstUseAcknowledged] = useState(false)
  const undoSnapshotRef = useRef<AutofillSnapshot | null>(null)

  const allowedByEmail = useMemo(() => {
    const email = normalize(userEmail)
    if (!email) return false
    return QA_AUTOFILL_ALLOWED_EMAILS.has(email)
  }, [userEmail])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (allowedByEmail) {
      window.localStorage.setItem(QA_AUTOFILL_TOKEN_KEY, "1")
      setTokenAllowed(true)
      return
    }
    if (!allowToken) {
      setTokenAllowed(false)
      return
    }
    setTokenAllowed(window.localStorage.getItem(QA_AUTOFILL_TOKEN_KEY) === "1")
  }, [allowToken, allowedByEmail])

  useEffect(() => {
    if (typeof window === "undefined") return
    const host = window.location.hostname.toLowerCase()
    const isLocalHost = host === "localhost" || host === "127.0.0.1"
    setLocalDevAllowed(Boolean(userEmail) && isLocalHost)
  }, [userEmail])

  useEffect(() => {
    if (typeof window === "undefined") return
    setFirstUseAcknowledged(
      window.localStorage.getItem(QA_AUTOFILL_FIRST_USE_ACK_KEY) === "1",
    )
  }, [])

  useEffect(() => {
    undoSnapshotRef.current = null
  }, [pathname])

  const allowed = localDevAllowed || allowedByEmail || (allowToken && tokenAllowed)

  const runAutofill = useCallback(() => {
    if (pending) return
    setPending(true)

    window.requestAnimationFrame(() => {
      void (async () => {
        try {
          let snapshot = captureAutofillSnapshot(pathname)
          let report = fillVisibleControls(pathname)
          const isPeoplePage = pathname.startsWith("/people")

          if (isPeoplePage && report.changed === 0) {
            const peopleSheet = await ensurePeopleAddSheetOpen()
            if (peopleSheet) {
              snapshot = captureAutofillSnapshot(pathname)
              const peopleReport = await fillPeopleAddSheet(pathname, peopleSheet)
              report = {
                changed: report.changed + peopleReport.changed,
                touched: report.touched + peopleReport.touched,
              }
            }
          }

          if (report.changed > 0) {
            undoSnapshotRef.current = snapshot
            toast.success(`Autofilled ${report.changed} fields for this page.`, {
              description: isPeoplePage
                ? "Review the person details, then click Add Person to save."
                : "Testing helper only. Use Undo if this was accidental.",
              action: {
                label: "Undo",
                onClick: () => {
                  const restored = restoreAutofillSnapshot(snapshot)
                  if (undoSnapshotRef.current === snapshot) {
                    undoSnapshotRef.current = null
                  }
                  if (restored > 0) {
                    toast.success(
                      `Autofill undone (${restored} field${restored === 1 ? "" : "s"} restored).`,
                    )
                  } else {
                    toast.info("Nothing changed to undo on this page.")
                  }
                },
              },
            })
          } else {
            toast.info("No empty visible fields to autofill on this page.")
          }
        } catch {
          toast.error("Unable to autofill this page right now.")
        } finally {
          setPending(false)
        }
      })()
    })
  }, [pathname, pending])

  const handleAutofillClick = useCallback(() => {
    if (pending) return
    if (!firstUseAcknowledged) {
      setConfirmOpen(true)
      return
    }
    runAutofill()
  }, [firstUseAcknowledged, pending, runAutofill])

  const handleConfirmAutofill = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(QA_AUTOFILL_FIRST_USE_ACK_KEY, "1")
    }
    setFirstUseAcknowledged(true)
    setConfirmOpen(false)
    runAutofill()
  }, [runAutofill])

  if (!allowed) return null

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 z-[70] flex",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-4",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="pointer-events-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur"
              onClick={handleAutofillClick}
              disabled={pending}
            >
              <SparklesIcon className="h-4 w-4" aria-hidden />
              {pending ? "Filling..." : "Autofill page"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8} className="max-w-[260px] leading-relaxed">
          Fills visible empty fields with QA demo data. First click shows details, and each
          fill can be undone.
        </TooltipContent>
      </Tooltip>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Use Autofill page for testing?</AlertDialogTitle>
            <AlertDialogDescription>
              This tester tool fills visible empty inputs with sample data on this page so QA
              can move quickly. It may trigger form state changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Use only in testing. If clicked by mistake, use the Undo action shown immediately
            after autofill.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAutofill} disabled={pending}>
              {pending ? "Filling..." : "Autofill page"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
