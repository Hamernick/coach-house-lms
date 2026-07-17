import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import PenLineIcon from "lucide-react/dist/esm/icons/pen-line"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import SendIcon from "lucide-react/dist/esm/icons/send"

import type {
  FiscalSponsorshipPrototypeDocument,
  FiscalSponsorshipPrototypeSigner,
  FiscalSponsorshipPrototypeStep,
} from "../types"
import {
  FISCAL_SPONSORSHIP_HANDBOOK_DOWNLOAD_HREF,
  FISCAL_SPONSORSHIP_HANDBOOK_HREF,
} from "./application-data"

export const FISCAL_SPONSORSHIP_PROTOTYPE_STEPS: FiscalSponsorshipPrototypeStep[] =
  [
    {
      id: "model",
      title: "Review sponsorship model",
      description:
        "Model C grantor-grantee structure, ownership, control, and revenue types.",
      detail:
        "Coach House receives restricted charitable contributions and makes grants to approved projects while the project lead keeps operational control.",
      badgeLabel: "Model guide",
      toolLabel: "Handbook guide",
      status: "approved",
      icon: SearchIcon,
    },
    {
      id: "application",
      title: "Complete sponsee application",
      description:
        "Basic info, legal structure, project overview, charitable class, and controls.",
      detail:
        "Collect the information needed to decide whether the project is charitable, noncommercial, and aligned with Coach House risk standards.",
      badgeLabel: "Intake",
      toolLabel: "Application intake",
      status: "approved",
      icon: FileTextIcon,
    },
    {
      id: "agreement",
      title: "Sign sponsorship agreement",
      description:
        "After Coach House accepts the application, review and sign the agreement.",
      detail:
        "Coach House prepares the Form B agreement. The applicant reviews and signs first, then a super admin countersigns. The executed copy stays in Documents.",
      badgeLabel: "Agreement",
      toolLabel: "Agreement packet",
      status: "planned",
      icon: PenLineIcon,
    },
    {
      id: "regrant",
      title: "Submit grant request",
      description:
        "Request amount, budget alignment, supporting docs, and payment instructions.",
      detail:
        "After approval and training, projects submit grant requests with documentation before Coach House releases funds.",
      badgeLabel: "Grant request",
      toolLabel: "Grant request",
      status: "planned",
      icon: SendIcon,
    },
  ]

export const FISCAL_SPONSORSHIP_DOCUMENTS: FiscalSponsorshipPrototypeDocument[] =
  [
    {
      id: "full-handbook",
      title: "2026 Coach House fiscal sponsorship handbook",
      description:
        "Full markdown handbook covering the Model C structure, requirements, agreement template, fundraising disclosure policy, grant request template, and internal controls.",
      href: FISCAL_SPONSORSHIP_HANDBOOK_HREF,
      downloadHref: FISCAL_SPONSORSHIP_HANDBOOK_DOWNLOAD_HREF,
      status: "Info",
      stepId: "model",
      signatureRequired: false,
    },
    {
      id: "how-it-works",
      title: "How fiscal sponsorship works",
      description:
        "Public-facing Model C overview, revenue rules, ownership, and fundraising guardrails.",
      href: FISCAL_SPONSORSHIP_HANDBOOK_HREF,
      status: "Info",
      stepId: "model",
      signatureRequired: false,
    },
    {
      id: "application-packet",
      title: "Fiscal sponsee application",
      description:
        "Applicant responses for basic information, legal structure, project purpose, finances, risks, and acknowledgements.",
      href: FISCAL_SPONSORSHIP_HANDBOOK_HREF,
      status: "Draft",
      stepId: "application",
      signatureRequired: true,
    },
    {
      id: "model-c-agreement",
      title: "Form B agreement",
      description:
        "Agreement prepared by Coach House after application acceptance, ready for applicant and sponsor signatures.",
      href: FISCAL_SPONSORSHIP_HANDBOOK_HREF,
      status: "Awaiting agreement",
      stepId: "agreement",
      signatureRequired: true,
    },
    {
      id: "grant-request",
      title: "Grant request form",
      description:
        "Amount, purpose, budget alignment, documentation, certification, and payment instructions.",
      href: FISCAL_SPONSORSHIP_HANDBOOK_HREF,
      status: "Ready later",
      stepId: "regrant",
      signatureRequired: true,
    },
  ]

export const FISCAL_SPONSORSHIP_SIGNATURE_PACKET: FiscalSponsorshipPrototypeSigner[] =
  [
    {
      id: "applicant",
      role: "Applicant",
      name: "Maya Johnson",
      status: "Needs signature",
      description:
        "Signs the application acknowledgements, Form B agreement, and grant request certifications.",
    },
    {
      id: "sponsor",
      role: "Sponsor",
      name: "Coach House Solutions Group, NFP",
      status: "Countersign",
      description:
        "Countersigns the Form B agreement after internal approval and applicant signature.",
    },
  ]
