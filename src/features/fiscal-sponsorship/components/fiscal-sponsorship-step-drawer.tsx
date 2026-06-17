"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"
import PenLineIcon from "lucide-react/dist/esm/icons/pen-line"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import UploadIcon from "lucide-react/dist/esm/icons/upload"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import {
  FISCAL_SPONSORSHIP_DOCUMENTS,
  FISCAL_SPONSORSHIP_SIGNATURE_PACKET,
} from "../lib/prototype-data"
import type {
  FiscalSponsorshipPrototypeDocument,
  FiscalSponsorshipProgramOption,
  FiscalSponsorshipPrototypeStep,
  FiscalSponsorshipPrototypeStepStatus,
} from "../types"
import { FiscalSponsorshipApplicationFields } from "./fiscal-sponsorship-application-fields"
import { FiscalSponsorshipHandbookGuide } from "./fiscal-sponsorship-handbook-guide"
import { FiscalSponsorshipMark } from "./fiscal-sponsorship-mark"

function DocumentStatusBadge({
  document,
}: {
  document: FiscalSponsorshipPrototypeDocument
}) {
  return (
    <Badge
      variant={document.signatureRequired ? "outline" : "secondary"}
      className="rounded-full border-transparent"
    >
      {document.status}
    </Badge>
  )
}

function DocumentQueue({
  selectedStep,
}: {
  selectedStep: FiscalSponsorshipPrototypeStep
}) {
  return (
    <div className="flex flex-col gap-3">
      {FISCAL_SPONSORSHIP_DOCUMENTS.map((document) => (
        <div
          key={document.id}
          className="bg-background flex items-start gap-3 rounded-xl border p-3"
        >
          <FolderOpenIcon
            className="text-muted-foreground mt-0.5 size-4"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium">{document.title}</p>
              {document.stepId === selectedStep.id ? (
                <Badge variant="secondary" className="rounded-full">
                  Current step
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-snug">
              {document.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DocumentStatusBadge document={document} />
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                <a href={document.href} target="_blank" rel="noreferrer">
                  Open viewer
                </a>
              </Button>
              {document.downloadHref ? (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                >
                  <a href={document.downloadHref} download>
                    Download markdown
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SignaturePanel({
  selectedStep,
}: {
  selectedStep: FiscalSponsorshipPrototypeStep
}) {
  const signableDocuments = FISCAL_SPONSORSHIP_DOCUMENTS.filter(
    (document) => document.signatureRequired
  )
  const currentDocument =
    signableDocuments.find((document) => document.stepId === selectedStep.id) ??
    signableDocuments.find((document) => document.id === "model-c-agreement")

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <PenLineIcon aria-hidden />
        <AlertTitle>DocuSeal signing packet</AlertTitle>
        <AlertDescription>
          Coach House sends signing documents through DocuSeal, then stores the
          executed agreement and audit metadata with the project.
        </AlertDescription>
      </Alert>
      <div className="bg-background rounded-2xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {currentDocument?.title ?? "Model C agreement"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-snug">
              {currentDocument?.description ??
                "Agreement prepared for signature."}
            </p>
          </div>
          {currentDocument ? (
            <DocumentStatusBadge document={currentDocument} />
          ) : null}
        </div>
        {currentDocument ? (
          <Button asChild size="sm" className="mt-4 rounded-full">
            <a href={currentDocument.href} target="_blank" rel="noreferrer">
              Open signing document
            </a>
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {FISCAL_SPONSORSHIP_SIGNATURE_PACKET.map((signer) => (
          <div
            key={signer.id}
            className="bg-background flex items-start gap-3 rounded-xl border p-3"
          >
            <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
              <PenLineIcon aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{signer.role}</p>
                <Badge variant="secondary" className="rounded-full">
                  {signer.status}
                </Badge>
              </div>
              <p className="text-sm">{signer.name}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-snug">
                {signer.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepWorkContent({
  programs,
  step,
}: {
  programs?: FiscalSponsorshipProgramOption[]
  step: FiscalSponsorshipPrototypeStep
}) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <SparklesIcon aria-hidden />
        <AlertTitle>{step.title}</AlertTitle>
        <AlertDescription>{step.detail}</AlertDescription>
      </Alert>
      {step.id === "model" ? <FiscalSponsorshipHandbookGuide /> : null}
      {step.id === "application" ? (
        <FiscalSponsorshipApplicationFields programs={programs} />
      ) : null}
      {step.id === "agreement" ? (
        <div className="flex flex-col gap-3">
          <Alert>
            <PenLineIcon aria-hidden />
            <AlertTitle>Agreement from Coach House</AlertTitle>
            <AlertDescription>
              Once your application is accepted, Coach House will send the Model
              C agreement here for review and signature.
            </AlertDescription>
          </Alert>
          <div className="bg-background rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Agreement status
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              No agreement has been sent yet. When Coach House accepts the
              application, the agreement will be available here to review and
              sign.
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
            >
              <a
                href="/fiscal-sponsorship/handbook#fs-agreement-template"
                target="_blank"
                rel="noreferrer"
              >
                Open agreement template
              </a>
            </Button>
          </div>
        </div>
      ) : null}
      {step.id === "regrant" ? (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fs-regrant-amount">
              Amount requested
            </FieldLabel>
            <Input id="fs-regrant-amount" defaultValue="$8,500" />
          </Field>
          <Field>
            <FieldLabel htmlFor="fs-regrant-purpose">
              Purpose of grant request
            </FieldLabel>
            <Textarea
              id="fs-regrant-purpose"
              defaultValue="Meal prep supplies, volunteer stipends, and venue rental for the next 60 days of programming."
              className="min-h-24 resize-none"
            />
          </Field>
          <Button variant="outline" size="sm" className="w-fit rounded-full">
            <UploadIcon data-icon="inline-start" />
            Attach invoices
          </Button>
        </FieldGroup>
      ) : null}
    </div>
  )
}

function getStepDetailPrimaryActionLabel({
  hasApplicationEditor,
  step,
}: {
  hasApplicationEditor: boolean
  step: FiscalSponsorshipPrototypeStep
}) {
  if (step.id === "application") {
    return hasApplicationEditor ? "Open application" : "Submit application"
  }

  if (step.id === "agreement") {
    if (step.status === "planned") return "Agreement not sent"
    if (step.status === "complete") return "Signed"

    return "Sign agreement"
  }

  if (step.id === "regrant") return "Submit grant request"

  return "Done"
}

function StepDetail({
  applicationActionDisabled = false,
  programs,
  step,
  onApprove,
  onOpenApplication,
}: {
  applicationActionDisabled?: boolean
  programs?: FiscalSponsorshipProgramOption[]
  step: FiscalSponsorshipPrototypeStep
  onApprove: () => void
  onOpenApplication?: () => void
}) {
  const hasApplicationEditor = Boolean(onOpenApplication)
  const primaryActionDisabled =
    (step.id === "application" && applicationActionDisabled) ||
    (step.id === "agreement" &&
      (step.status === "planned" || step.status === "complete"))

  function handlePrimaryAction() {
    if (step.id === "application" && onOpenApplication) {
      onOpenApplication()
      return
    }

    onApprove()
  }

  return (
    <Tabs defaultValue="work" className="min-h-0 flex-1">
      <TabsList className="bg-muted mx-4 mt-3 grid grid-cols-3 rounded-full p-1">
        <TabsTrigger
          value="work"
          className="data-[state=active]:bg-background rounded-full"
        >
          Work
        </TabsTrigger>
        <TabsTrigger
          value="docs"
          className="data-[state=active]:bg-background rounded-full"
        >
          Docs
        </TabsTrigger>
        <TabsTrigger
          value="sign"
          className="data-[state=active]:bg-background rounded-full"
        >
          Sign
        </TabsTrigger>
      </TabsList>
      <ScrollArea
        className="min-h-0 flex-1 px-4"
        viewportClassName="max-h-[calc(100svh-15rem)] scroll-fade-effect-y [--mask-height:2rem] [--scroll-buffer:1.5rem]"
      >
        <TabsContent value="work" className="mt-4">
          <StepWorkContent step={step} programs={programs} />
        </TabsContent>
        <TabsContent value="docs" className="mt-4">
          <DocumentQueue selectedStep={step} />
        </TabsContent>
        <TabsContent value="sign" className="mt-4">
          <SignaturePanel selectedStep={step} />
        </TabsContent>
      </ScrollArea>
      <SheetFooter className="border-t">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            className="rounded-full"
            disabled={primaryActionDisabled}
            onClick={handlePrimaryAction}
          >
            <CheckIcon data-icon="inline-start" />
            {getStepDetailPrimaryActionLabel({ hasApplicationEditor, step })}
          </Button>
        </div>
      </SheetFooter>
    </Tabs>
  )
}

export function FiscalSponsorshipStepDrawer({
  applicationActionDisabled = false,
  programs,
  selectedStep,
  onApprove,
  onClose,
  onOpenApplication,
}: {
  applicationActionDisabled?: boolean
  programs?: FiscalSponsorshipProgramOption[]
  selectedStep: FiscalSponsorshipPrototypeStep
  onApprove: (status: FiscalSponsorshipPrototypeStepStatus) => void
  onClose: () => void
  onOpenApplication?: () => void
}) {
  return (
    <SheetContent className="w-[min(100vw,34rem)] gap-0 p-0 sm:max-w-[34rem]">
      <SheetHeader className="border-b p-5">
        <div className="flex items-start gap-3 pr-8">
          <FiscalSponsorshipMark />
          <div className="min-w-0">
            <SheetTitle className="text-lg">{selectedStep.title}</SheetTitle>
            <SheetDescription>{selectedStep.description}</SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <StepDetail
        applicationActionDisabled={applicationActionDisabled}
        step={selectedStep}
        programs={programs}
        onOpenApplication={onOpenApplication}
        onApprove={() =>
          onApprove(selectedStep.id === "agreement" ? "complete" : "approved")
        }
      />
      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={onClose}
        >
          <PanelRightOpenIcon data-icon="inline-start" />
          Back to plan
        </Button>
      </div>
    </SheetContent>
  )
}
