import Link from "next/link"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import FileSignatureIcon from "lucide-react/dist/esm/icons/file-signature"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FiscalSponsorshipSigningSession } from "../../types"

function getStatusMessage(session: FiscalSponsorshipSigningSession) {
  if (session.packetStatus === "completed") return "Signing is complete."
  if (session.packetStatus === "applicant_signed") {
    return session.role === "coach_house"
      ? "The applicant signed. Review and countersign the locked agreement."
      : "Your signature is complete. Coach House will countersign next."
  }
  if (session.role === "coach_house")
    return "Waiting for the applicant to sign first."
  return "Review the prefilled fields, correct anything needed, and sign."
}

export function FiscalSponsorshipSigningHeader({
  backHref,
  saveMessage,
  saveState,
  session,
}: {
  backHref: string
  saveMessage: string
  saveState: "idle" | "saving" | "saved" | "error"
  session: FiscalSponsorshipSigningSession
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
          <Link href={backHref}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden />
            Back
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
            <FileSignatureIcon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign Form B Agreement
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {session.projectName} for {session.organizationName}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {getStatusMessage(session)}
            </p>
          </div>
        </div>
      </div>
      {session.canSign ? (
        <p
          className={cn(
            "text-muted-foreground min-h-5 text-sm",
            saveState === "error" && "text-destructive"
          )}
          role={saveState === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {saveMessage || "Changes save automatically"}
        </p>
      ) : null}
    </div>
  )
}

export function FiscalSponsorshipSigningCompletedAlert({
  session,
}: {
  session: FiscalSponsorshipSigningSession
}) {
  if (session.packetStatus !== "completed") return null

  return (
    <Alert className="mb-5">
      <CheckCircle2Icon aria-hidden />
      <AlertTitle>Agreement fully executed</AlertTitle>
      <AlertDescription>
        Both signatures are complete. Each download is verified against its
        stored SHA-256 hash.
        <div className="mt-3 flex flex-wrap gap-2">
          {session.executedDocumentHref ? (
            <Button asChild size="sm">
              <a href={session.executedDocumentHref}>
                <DownloadIcon data-icon="inline-start" aria-hidden />
                Executed Agreement
              </a>
            </Button>
          ) : null}
          {session.auditDocumentHref ? (
            <Button asChild size="sm" variant="outline">
              <a href={session.auditDocumentHref}>
                <DownloadIcon data-icon="inline-start" aria-hidden />
                Execution Certificate
              </a>
            </Button>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export function FiscalSponsorshipSigningPreview({ href }: { href: string }) {
  return (
    <section className="border-border bg-muted/30 order-2 min-w-0 overflow-hidden rounded-2xl border lg:order-1">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Agreement Preview</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Four-page source document with the current saved fields and
          signatures.
        </p>
      </div>
      <iframe
        key={href}
        src={href}
        title="Form B Fiscal Sponsorship Agreement preview"
        className="bg-background h-[64svh] min-h-[34rem] w-full lg:h-[calc(100svh-15rem)]"
      />
    </section>
  )
}
