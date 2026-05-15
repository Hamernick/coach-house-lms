import type * as React from "react"

export type FiscalSponsorshipInput = {
  id: string
}

export type FiscalSponsorshipPrototypeStepStatus =
  | "approved"
  | "planned"
  | "running"
  | "complete"
  | "skipped"

export type FiscalSponsorshipPrototypeStep = {
  id: string
  title: string
  description: string
  detail: string
  toolLabel: string
  status: FiscalSponsorshipPrototypeStepStatus
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export type FiscalSponsorshipPrototypeDocumentStatus =
  | "Info"
  | "Draft PDF"
  | "Needs signature"
  | "Ready later"

export type FiscalSponsorshipPrototypeDocument = {
  id: string
  title: string
  description: string
  href: string
  status: FiscalSponsorshipPrototypeDocumentStatus
  stepId: FiscalSponsorshipPrototypeStep["id"]
  signatureRequired: boolean
}

export type FiscalSponsorshipPrototypeSigner = {
  id: string
  role: string
  name: string
  status: "Needs signature" | "Waiting" | "Countersign"
  description: string
}
