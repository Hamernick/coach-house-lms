"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"
import PenLineIcon from "lucide-react/dist/esm/icons/pen-line"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import UploadIcon from "lucide-react/dist/esm/icons/upload"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  FISCAL_SPONSORSHIP_DOCUMENTS,
  FISCAL_SPONSORSHIP_REVIEW_CHECKS,
  FISCAL_SPONSORSHIP_SIGNATURE_PACKET,
} from "../lib/prototype-data"
import type {
  FiscalSponsorshipPrototypeDocument,
  FiscalSponsorshipPrototypeStep,
  FiscalSponsorshipPrototypeStepStatus,
} from "../types"
import { FiscalSponsorshipMark } from "./fiscal-sponsorship-mark"

function ApplicationFields() {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="fs-project-name">Project name</FieldLabel>
        <Input id="fs-project-name" defaultValue="South Side Civic Kitchen" />
      </Field>
      <Field>
        <FieldLabel htmlFor="fs-project-lead">Project lead</FieldLabel>
        <Input id="fs-project-lead" defaultValue="Maya Johnson" />
      </Field>
      <Field>
        <FieldLabel htmlFor="fs-email">Email</FieldLabel>
        <Input id="fs-email" type="email" defaultValue="maya@example.org" />
      </Field>
      <Field>
        <FieldLabel>Legal structure</FieldLabel>
        <ToggleGroup
          type="single"
          defaultValue="association"
          className="bg-muted grid w-full grid-cols-2 rounded-xl p-1"
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="individual" className="rounded-lg">
            Individual
          </ToggleGroupItem>
          <ToggleGroupItem value="association" className="rounded-lg">
            Association
          </ToggleGroupItem>
          <ToggleGroupItem value="llc" className="rounded-lg">
            LLC
          </ToggleGroupItem>
          <ToggleGroupItem value="corporation" className="rounded-lg">
            Corporation
          </ToggleGroupItem>
        </ToggleGroup>
        <FieldDescription>
          Legal entities will need formation documents and a recent
          good-standing certificate.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="fs-overview">Project overview</FieldLabel>
        <Textarea
          id="fs-overview"
          defaultValue="A community food access and mutual aid initiative that provides free prepared meals, nutrition education, and neighborhood volunteer coordination."
          className="min-h-24 resize-none"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="fs-charitable-purpose">
          Charitable purpose
        </FieldLabel>
        <Textarea
          id="fs-charitable-purpose"
          defaultValue="Advances community support, health, and food security for a broad neighborhood charitable class."
          className="min-h-20 resize-none"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="fs-financial-goals">
          12-month financial goals
        </FieldLabel>
        <Input
          id="fs-financial-goals"
          defaultValue="$85,000 contributed revenue / $62,000 expenses"
        />
        <FieldDescription>
          Placeholder for contributed revenue, earned revenue, and projected
          expenses from the application outline.
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}

function ReviewChecklist() {
  return (
    <FieldSet className="bg-muted/35 rounded-2xl border p-3">
      <FieldLegend className="px-1">Review criteria</FieldLegend>
      <div className="flex flex-col gap-2.5">
        {FISCAL_SPONSORSHIP_REVIEW_CHECKS.map((check) => (
          <label
            key={check}
            className="bg-background flex min-h-12 items-start gap-3 rounded-xl border px-3 py-2.5 text-sm"
          >
            <Checkbox defaultChecked />
            <span className="leading-snug">{check}</span>
          </label>
        ))}
      </div>
    </FieldSet>
  )
}

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
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <a href={document.href} target="_blank" rel="noreferrer">
                  Open placeholder PDF
                </a>
              </Button>
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
  const currentDocument = signableDocuments.find(
    (document) => document.stepId === selectedStep.id
  ) ?? signableDocuments.find((document) => document.id === "model-c-agreement")

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <PenLineIcon aria-hidden />
        <AlertTitle>Signature routing placeholder</AlertTitle>
        <AlertDescription>
          Use dummy PDFs for now. The live version can generate these documents,
          send them through DocuSeal, then store the executed PDF and signing
          audit metadata in Documents.
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
                "Generated agreement prepared for signature."}
            </p>
          </div>
          {currentDocument ? <DocumentStatusBadge document={currentDocument} /> : null}
        </div>
        {currentDocument ? (
          <Button asChild size="sm" className="mt-4 rounded-full">
            <a href={currentDocument.href} target="_blank" rel="noreferrer">
              Open signing PDF
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

function StepWorkContent({ step }: { step: FiscalSponsorshipPrototypeStep }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <SparklesIcon aria-hidden />
        <AlertTitle>{step.title}</AlertTitle>
        <AlertDescription>{step.detail}</AlertDescription>
      </Alert>
      {step.id === "model" ? (
        <div className="text-muted-foreground grid gap-3 text-sm">
          <p>
            Fiscal sponsorship is presented as a Model C grant relationship:
            Coach House receives restricted charitable funds and makes re-grants
            for approved project expenses.
          </p>
          <p>
            The applicant keeps day-to-day control, while Coach House handles
            oversight, compliance guardrails, and donor/funder credibility.
          </p>
        </div>
      ) : null}
      {step.id === "application" ? <ApplicationFields /> : null}
      {step.id === "review" ? <ReviewChecklist /> : null}
      {step.id === "agreement" ? (
        <div className="flex flex-col gap-3">
          <Alert>
            <PenLineIcon aria-hidden />
            <AlertTitle>DocuSeal candidate</AlertTitle>
            <AlertDescription>
              This would generate a Model C agreement from approved answers,
              create a signing submission, and store the executed PDF plus audit
              metadata.
            </AlertDescription>
          </Alert>
          <div className="bg-background rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Agreement preview
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              Coach House Solutions Group, NFP will act as fiscal sponsor for
              South Side Civic Kitchen under a grantor-grantee relationship.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
              <a
                href="/fiscal-sponsorship/placeholders/model-c-agreement.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Open dummy agreement PDF
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
              Purpose of re-grant
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

function StepDetail({
  step,
  onApprove,
  onSkip,
}: {
  step: FiscalSponsorshipPrototypeStep
  onApprove: () => void
  onSkip: () => void
}) {
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
        viewportClassName="max-h-[calc(100svh-15rem)]"
      >
        <TabsContent value="work" className="mt-4">
          <StepWorkContent step={step} />
        </TabsContent>
        <TabsContent value="docs" className="mt-4">
          <DocumentQueue selectedStep={step} />
        </TabsContent>
        <TabsContent value="sign" className="mt-4">
          <SignaturePanel selectedStep={step} />
        </TabsContent>
      </ScrollArea>
      <SheetFooter className="border-t">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={onSkip}
          >
            <XIcon data-icon="inline-start" />
            Skip
          </Button>
          <Button size="sm" className="rounded-full" onClick={onApprove}>
            <CheckIcon data-icon="inline-start" />
            Approve
          </Button>
        </div>
      </SheetFooter>
    </Tabs>
  )
}

export function FiscalSponsorshipStepDrawer({
  selectedStep,
  onApprove,
  onClose,
  onSkip,
}: {
  selectedStep: FiscalSponsorshipPrototypeStep
  onApprove: (status: FiscalSponsorshipPrototypeStepStatus) => void
  onClose: () => void
  onSkip: (status: FiscalSponsorshipPrototypeStepStatus) => void
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
        step={selectedStep}
        onApprove={() => onApprove("approved")}
        onSkip={() => onSkip("skipped")}
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
