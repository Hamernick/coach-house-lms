"use client"

import * as React from "react"
import Link from "next/link"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileCheck2Icon from "lucide-react/dist/esm/icons/file-check-2"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { completeFiscalSponsorshipW9 } from "../../actions"
import type {
  FiscalSponsorshipSignatureMethod,
  FiscalSponsorshipW9Session,
} from "../../types"
import {
  FISCAL_SPONSORSHIP_W9_TEMPLATE,
  validateFiscalSponsorshipW9Fields,
  type FiscalSponsorshipW9Fields,
} from "../../lib/w9-field-manifest"
import {
  FiscalSponsorshipW9AddressAndTinFields,
  FiscalSponsorshipW9IdentityFields,
} from "./fiscal-sponsorship-w9-fields"
import { FiscalSponsorshipW9SignatureFields } from "./fiscal-sponsorship-w9-signature"

type W9FieldErrors = Partial<Record<keyof FiscalSponsorshipW9Fields, string>>

function W9DocumentLink({
  children,
  download,
  href,
}: {
  children: React.ReactNode
  download?: boolean
  href: string
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <a
        href={download ? `${href}?download=1` : href}
        target="_blank"
        rel="noreferrer"
      >
        {download ? (
          <DownloadIcon data-icon="inline-start" aria-hidden />
        ) : (
          <ExternalLinkIcon data-icon="inline-start" aria-hidden />
        )}
        {children}
      </a>
    </Button>
  )
}

export function FiscalSponsorshipW9Page({
  initialSession,
}: {
  initialSession: FiscalSponsorshipW9Session
}) {
  const [fields, setFields] = React.useState(initialSession.fields)
  const [errors, setErrors] = React.useState<W9FieldErrors>({})
  const [signatureMethod, setSignatureMethod] =
    React.useState<FiscalSponsorshipSignatureMethod>("typed")
  const [signatureValue, setSignatureValue] = React.useState("")
  const [signatureError, setSignatureError] = React.useState("")
  const [authorized, setAuthorized] = React.useState(false)
  const [certified, setCertified] = React.useState(false)
  const [consented, setConsented] = React.useState(false)
  const [showTin, setShowTin] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState("")
  const [completedDocumentHref, setCompletedDocumentHref] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    if (!dirty) return
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [dirty])

  function updateField<Key extends keyof FiscalSponsorshipW9Fields>(
    key: Key,
    value: FiscalSponsorshipW9Fields[Key]
  ) {
    setFields((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError("")
    setDirty(true)
  }

  function focusField(field: string | undefined) {
    if (!field) return
    const id =
      field === "signature"
        ? "w9-signature-typed"
        : field === "taxClassification"
          ? "w9-classification-individual"
          : field === "llcClassification"
            ? "w9-llc-classification"
            : `w9-${field}`
    window.requestAnimationFrame(() => document.getElementById(id)?.focus())
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError("")
    setSignatureError("")
    const nextErrors = validateFiscalSponsorshipW9Fields(fields)
    setErrors(nextErrors)
    const firstError = Object.entries(nextErrors)[0]
    if (firstError) {
      focusField(firstError[0])
      return
    }
    if (!signatureValue.trim()) {
      setSignatureError("Add your signature before continuing.")
      focusField("signature")
      return
    }
    if (!certified || !consented || !authorized) {
      setSubmitError(
        "Confirm the W-9 certification, electronic consent, and signing authority."
      )
      return
    }

    setSubmitting(true)
    const result = await completeFiscalSponsorshipW9({
      authorized,
      certified,
      consented,
      fields,
      projectId: initialSession.projectId,
      signatureMethod,
      signatureValue,
    })
    setSubmitting(false)
    if ("error" in result) {
      setSubmitError(result.error)
      if (result.field === "signature") setSignatureError(result.error)
      focusField(result.field)
      return
    }

    setDirty(false)
    setFields((current) => ({ ...current, tin: "" }))
    setCompletedDocumentHref(result.documentHref)
  }

  function startUpdatedCopy() {
    setCompletedDocumentHref(null)
    setSignatureMethod("typed")
    setSignatureValue("")
    setAuthorized(false)
    setCertified(false)
    setConsented(false)
    setSubmitError("")
    setSignatureError("")
    setErrors({})
    setDirty(false)
    window.scrollTo({ behavior: "smooth", top: 0 })
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/my-organization">Back to fiscal sponsorship</Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold text-balance">
            Complete IRS Form W-9
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm text-pretty">
            {initialSession.projectName} for {initialSession.organizationName}.
            Your signed copy is stored privately and shared with authorized
            Coach House staff.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a
            href="https://www.irs.gov/forms-pubs/about-form-w-9"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon data-icon="inline-start" aria-hidden />
            IRS instructions
          </a>
        </Button>
      </header>

      {initialSession.existingDocumentHref && !completedDocumentHref ? (
        <Alert className="mb-5">
          <FileCheck2Icon aria-hidden />
          <AlertTitle>Signed W-9 already stored</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Completing this form creates a new version without deleting the
              prior copy.
            </span>
            <W9DocumentLink href={initialSession.existingDocumentHref}>
              View current copy
            </W9DocumentLink>
          </AlertDescription>
        </Alert>
      ) : null}

      {completedDocumentHref ? (
        <Alert className="mb-5">
          <FileCheck2Icon aria-hidden />
          <AlertTitle>Signed W-9 saved</AlertTitle>
          <AlertDescription>
            <p className="text-pretty">
              The immutable PDF is now available to you and authorized Coach
              House staff.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <W9DocumentLink href={completedDocumentHref}>
                View signed W-9
              </W9DocumentLink>
              <W9DocumentLink href={completedDocumentHref} download>
                Download copy
              </W9DocumentLink>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startUpdatedCopy}
              >
                Create updated W-9
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {!completedDocumentHref ? (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)] lg:items-start">
          <section className="border-border bg-card order-2 min-w-0 overflow-hidden rounded-2xl border lg:sticky lg:top-6 lg:order-1">
            <div className="border-border border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-balance">
                Official Form W-9
              </h2>
              <p className="text-muted-foreground mt-1 text-xs text-pretty">
                {FISCAL_SPONSORSHIP_W9_TEMPLATE.revision} IRS revision. The
                secured final copy is generated after signing.
              </p>
            </div>
            <iframe
              src={FISCAL_SPONSORSHIP_W9_TEMPLATE.path}
              title="Official blank IRS Form W-9"
              className="h-[48rem] w-full bg-white"
            />
          </section>

          <form
            onSubmit={handleSubmit}
            className="border-border bg-card order-1 rounded-2xl border p-4 sm:p-5 lg:order-2"
          >
            <FiscalSponsorshipW9IdentityFields
              errors={errors}
              fields={fields}
              onChange={updateField}
            />
            <Separator className="my-6" />
            <FiscalSponsorshipW9AddressAndTinFields
              errors={errors}
              fields={fields}
              onChange={updateField}
              showTin={showTin}
              onShowTinChange={setShowTin}
            />
            <Separator className="my-6" />
            <FiscalSponsorshipW9SignatureFields
              authorized={authorized}
              certified={certified}
              consented={consented}
              signatureError={signatureError}
              signatureMethod={signatureMethod}
              signatureValue={signatureValue}
              signerName={initialSession.signerName}
              subjectToBackupWithholding={fields.subjectToBackupWithholding}
              onAuthorizedChange={(value) => {
                setAuthorized(value)
                setDirty(true)
              }}
              onCertifiedChange={(value) => {
                setCertified(value)
                setDirty(true)
              }}
              onConsentedChange={(value) => {
                setConsented(value)
                setDirty(true)
              }}
              onSignatureMethodChange={(value) => {
                setSignatureMethod(value)
                setDirty(true)
              }}
              onSignatureValueChange={(value) => {
                setSignatureValue(value)
                setSignatureError("")
                setDirty(true)
              }}
            />

            {submitError ? (
              <Alert variant="destructive" className="mt-5">
                <AlertTitle>W-9 not saved</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                  aria-hidden
                />
              ) : (
                <FileCheck2Icon data-icon="inline-start" aria-hidden />
              )}
              Sign and save W-9
            </Button>
            <p className="text-muted-foreground mt-3 text-center text-xs leading-4 text-pretty">
              The audit record includes your authenticated account, consent, UTC
              timestamp, and document SHA-256. It never stores the full TIN in
              database fields.
            </p>
          </form>
        </div>
      ) : null}
    </main>
  )
}
