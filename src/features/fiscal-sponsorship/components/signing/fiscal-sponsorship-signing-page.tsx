"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import FileSignatureIcon from "lucide-react/dist/esm/icons/file-signature"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  completeFiscalSponsorshipSignature,
  saveFiscalSponsorshipSigningDraft,
} from "../../actions"
import {
  validateFiscalSponsorshipFormBFields,
  type FiscalSponsorshipFormBFieldKey,
} from "../../lib/form-b-field-manifest"
import type {
  FiscalSponsorshipSignatureMethod,
  FiscalSponsorshipSigningSession,
} from "../../types"
import { FiscalSponsorshipSignatureCanvas } from "./fiscal-sponsorship-signature-canvas"
import {
  FiscalSponsorshipSigningCompletedAlert,
  FiscalSponsorshipSigningHeader,
  FiscalSponsorshipSigningPreview,
} from "./fiscal-sponsorship-signing-chrome"
import {
  FiscalSponsorshipFormBFieldGrid,
  FiscalSponsorshipSigningConsentFields,
} from "./fiscal-sponsorship-signing-fields"

type SaveState = "idle" | "saving" | "saved" | "error"

export function FiscalSponsorshipSigningPage({
  initialSession,
}: {
  initialSession: FiscalSponsorshipSigningSession
}) {
  const router = useRouter()
  const [fields, setFields] = React.useState(initialSession.fields)
  const [signatureMethod, setSignatureMethod] =
    React.useState<FiscalSponsorshipSignatureMethod>(
      initialSession.signatureMethod
    )
  const [signatureValue, setSignatureValue] = React.useState(
    initialSession.signatureValue
  )
  const [signerTitle, setSignerTitle] = React.useState(
    initialSession.signerTitle
  )
  const [confirmed, setConfirmed] = React.useState(initialSession.confirmed)
  const [consented, setConsented] = React.useState(false)
  const [authorized, setAuthorized] = React.useState(false)
  const [saveState, setSaveState] = React.useState<SaveState>("idle")
  const [saveMessage, setSaveMessage] = React.useState("")
  const [submitError, setSubmitError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [previewVersion, setPreviewVersion] = React.useState(0)
  const revisionRef = React.useRef(initialSession.draftRevision)
  const firstAutosaveRef = React.useRef(true)
  const savingRef = React.useRef(false)
  const needsSaveRef = React.useRef(false)
  const dirtyRef = React.useRef(false)
  const autosaveTimeoutRef = React.useRef<number | null>(null)
  const performSaveRef = React.useRef<() => Promise<void>>(async () => {})
  const payloadRef = React.useRef({
    fields,
    signatureMethod,
    signatureValue,
    signerTitle,
    confirmed,
  })
  payloadRef.current = {
    fields,
    signatureMethod,
    signatureValue,
    signerTitle,
    confirmed,
  }

  const performSave = React.useCallback(async () => {
    if (!initialSession.canSign) return
    if (savingRef.current) {
      needsSaveRef.current = true
      return
    }

    savingRef.current = true
    needsSaveRef.current = false
    setSaveState("saving")
    setSaveMessage("Saving changes")
    const payload = payloadRef.current
    const result = await saveFiscalSponsorshipSigningDraft({
      ...payload,
      expectedRevision: revisionRef.current,
      packetId: initialSession.packetId,
    })
    savingRef.current = false

    if ("error" in result) {
      setSaveState("error")
      setSaveMessage(result.error)
      dirtyRef.current = true
      return
    }

    revisionRef.current = result.revision
    dirtyRef.current = needsSaveRef.current
    setSaveState("saved")
    setSaveMessage(
      `Saved ${new Date(result.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    )
    setPreviewVersion((value) => value + 1)
    if (needsSaveRef.current) void performSaveRef.current()
  }, [initialSession.canSign, initialSession.packetId])
  performSaveRef.current = performSave

  React.useEffect(() => {
    if (firstAutosaveRef.current) {
      firstAutosaveRef.current = false
      return
    }
    if (!initialSession.canSign) return
    dirtyRef.current = true
    autosaveTimeoutRef.current = window.setTimeout(
      () => void performSave(),
      750
    )
    return () => {
      if (autosaveTimeoutRef.current !== null) {
        window.clearTimeout(autosaveTimeoutRef.current)
        autosaveTimeoutRef.current = null
      }
    }
  }, [
    confirmed,
    fields,
    initialSession.canSign,
    performSave,
    signatureMethod,
    signatureValue,
    signerTitle,
  ])

  React.useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current && !savingRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [])

  function updateField(key: FiscalSponsorshipFormBFieldKey, value: string) {
    setFields((current) => ({ ...current, [key]: value }))
    setSubmitError("")
  }

  function focusField(field: string | undefined) {
    if (!field) return
    window.requestAnimationFrame(() => {
      document
        .getElementById(
          field === "signature"
            ? "fiscal-signature-typed"
            : field === "signerTitle"
              ? "fiscal-signer-title"
              : `form-b-${field}`
        )
        ?.focus()
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError("")

    const errors = validateFiscalSponsorshipFormBFields(fields)
    const firstError = Object.entries(errors)[0]
    if (firstError) {
      setSubmitError(firstError[1])
      focusField(firstError[0])
      return
    }
    if (!signatureValue.trim()) {
      setSubmitError("Add your signature before continuing.")
      focusField("signature")
      return
    }
    if (signerTitle.trim().length < 2) {
      setSubmitError("Enter your title or signing capacity.")
      focusField("signerTitle")
      return
    }
    if (!confirmed || !consented || !authorized) {
      setSubmitError(
        "Confirm the document, electronic consent, and signing authority."
      )
      return
    }

    setSubmitting(true)
    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current)
      autosaveTimeoutRef.current = null
    }
    await performSave()
    if (dirtyRef.current || savingRef.current) {
      setSubmitting(false)
      setSubmitError(
        "Your latest changes have not finished saving. Wait a moment and try again."
      )
      return
    }
    const result = await completeFiscalSponsorshipSignature({
      authorized,
      confirmed,
      consented,
      expectedRevision: revisionRef.current,
      fields,
      packetId: initialSession.packetId,
      signatureMethod,
      signatureValue,
      signerTitle,
    })
    setSubmitting(false)
    if ("error" in result) {
      setSubmitError(result.error)
      focusField(result.field)
      return
    }
    dirtyRef.current = false
    router.refresh()
  }

  const backHref =
    initialSession.role === "coach_house"
      ? `/organizations/${initialSession.organizationId}`
      : "/my-organization"
  const previewHref = `${initialSession.previewHref}?revision=${previewVersion}`

  return (
    <main className="mx-auto w-full max-w-[96rem] px-4 py-6 lg:px-6">
      <FiscalSponsorshipSigningHeader
        backHref={backHref}
        saveMessage={saveMessage}
        saveState={saveState}
        session={initialSession}
      />
      <FiscalSponsorshipSigningCompletedAlert session={initialSession} />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,31rem)] lg:items-start">
        <FiscalSponsorshipSigningPreview href={previewHref} />

        <form
          onSubmit={handleSubmit}
          className="border-border bg-card order-1 rounded-2xl border p-4 sm:p-5 lg:order-2"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {initialSession.role === "applicant"
                ? "Confirm Agreement Details"
                : "Review Applicant Details"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-5">
              {initialSession.fieldsEditable
                ? "Prefilled from your application. Correct any personal or organization information before signing."
                : "Applicant-confirmed fields are locked after the first signature."}
            </p>
          </div>

          <FiscalSponsorshipFormBFieldGrid
            editable={initialSession.fieldsEditable}
            fields={fields}
            onChange={updateField}
          />

          <Separator className="my-6" />

          <div>
            <h2 className="text-lg font-semibold">Your Signature</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Signing as {initialSession.signerName} (
              {initialSession.signerEmail}).
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="fiscal-signer-title">Title</Label>
            <Input
              id="fiscal-signer-title"
              name="signerTitle"
              value={signerTitle}
              disabled={!initialSession.canSign}
              maxLength={120}
              required
              autoComplete="organization-title"
              onChange={(event) => setSignerTitle(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Your role or capacity for the named party.
            </p>
          </div>
          <Tabs
            value={signatureMethod}
            onValueChange={(value) => {
              setSignatureMethod(value as FiscalSponsorshipSignatureMethod)
              setSignatureValue(
                value === "typed" ? initialSession.signerName : ""
              )
            }}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="typed" disabled={!initialSession.canSign}>
                Type
              </TabsTrigger>
              <TabsTrigger value="drawn" disabled={!initialSession.canSign}>
                Draw
              </TabsTrigger>
            </TabsList>
            <TabsContent value="typed" className="mt-3 space-y-2">
              <Label htmlFor="fiscal-signature-typed">Typed Signature</Label>
              <Input
                id="fiscal-signature-typed"
                value={signatureMethod === "typed" ? signatureValue : ""}
                disabled={!initialSession.canSign}
                maxLength={120}
                className="font-serif text-lg italic"
                onChange={(event) => setSignatureValue(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Typing your name is your electronic signature.
              </p>
            </TabsContent>
            <TabsContent value="drawn" className="mt-3">
              <FiscalSponsorshipSignatureCanvas
                disabled={!initialSession.canSign}
                value={signatureMethod === "drawn" ? signatureValue : ""}
                onChange={setSignatureValue}
              />
            </TabsContent>
          </Tabs>

          <FiscalSponsorshipSigningConsentFields
            authorized={authorized}
            confirmed={confirmed}
            consented={consented}
            disabled={!initialSession.canSign}
            onAuthorizedChange={setAuthorized}
            onConfirmedChange={setConfirmed}
            onConsentedChange={setConsented}
          />

          {submitError ? (
            <Alert variant="destructive" className="mt-5">
              <AlertTitle>Signature Not Completed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={!initialSession.canSign || submitting}
          >
            <FileSignatureIcon data-icon="inline-start" aria-hidden />
            {submitting
              ? "Signing…"
              : initialSession.role === "coach_house"
                ? "Countersign Agreement"
                : "Sign Agreement"}
          </Button>
          <p className="text-muted-foreground mt-3 text-center text-xs leading-4">
            Signing records your authenticated account, consent version, UTC
            timestamp, and document SHA-256.
          </p>
        </form>
      </div>
    </main>
  )
}
