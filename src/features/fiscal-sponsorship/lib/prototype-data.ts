import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import PenLineIcon from "lucide-react/dist/esm/icons/pen-line"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import SendIcon from "lucide-react/dist/esm/icons/send"
import ShieldCheckIcon from "lucide-react/dist/esm/icons/shield-check"

import type {
  FiscalSponsorshipPrototypeDocument,
  FiscalSponsorshipPrototypeSigner,
  FiscalSponsorshipPrototypeStep,
} from "../types"

export const FISCAL_SPONSORSHIP_PROTOTYPE_STEPS: FiscalSponsorshipPrototypeStep[] =
  [
    {
      id: "model",
      title: "Review sponsorship model",
      description:
        "Model C grantor-grantee structure, ownership, control, and revenue types.",
      detail:
        "Coach House receives restricted charitable contributions and makes grants to approved projects while the project lead keeps operational control.",
      toolLabel: "Info screen",
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
      toolLabel: "Applicant form",
      status: "approved",
      icon: FileTextIcon,
    },
    {
      id: "review",
      title: "Coach House compliance review",
      description:
        "Confirm public benefit, fundraising language, conflicts, and risk disclosures.",
      detail:
        "Staff review should be transparent: clarify gaps, request missing materials, and approve only when the charitable use and controls are clear.",
      toolLabel: "Review checklist",
      status: "planned",
      icon: ShieldCheckIcon,
    },
    {
      id: "agreement",
      title: "Generate & send agreement",
      description:
        "Prepare the Model C agreement and route it for applicant and sponsor signatures.",
      detail:
        "The signed agreement should be generated from the approved application, sent for signature, and stored with the project documents.",
      toolLabel: "DocuSeal-ready",
      status: "planned",
      icon: PenLineIcon,
    },
    {
      id: "regrant",
      title: "Submit re-grant request",
      description:
        "Request amount, budget alignment, supporting docs, and payment instructions.",
      detail:
        "After approval and training, projects submit re-grant requests with documentation before Coach House releases funds.",
      toolLabel: "Documents",
      status: "planned",
      icon: SendIcon,
    },
  ]

export const FISCAL_SPONSORSHIP_REVIEW_CHECKS = [
  "Project serves a clear charitable class or public benefit.",
  "Activities are not primarily commercial or for private enrichment.",
  "Fundraising materials referencing Coach House are ready for review.",
  "Banking and recordkeeping controls are acknowledged.",
]

export const FISCAL_SPONSORSHIP_DOCUMENTS: FiscalSponsorshipPrototypeDocument[] =
  [
    {
      id: "how-it-works",
      title: "How fiscal sponsorship works",
      description:
        "Public-facing Model C overview, revenue rules, ownership, and fundraising guardrails.",
      href: "/fiscal-sponsorship/placeholders/how-it-works.pdf",
      status: "Info",
      stepId: "model",
      signatureRequired: false,
    },
    {
      id: "application-packet",
      title: "Fiscal sponsee application",
      description:
        "Applicant responses for basic information, legal structure, project purpose, finances, risks, and acknowledgements.",
      href: "/fiscal-sponsorship/placeholders/sponsee-application.pdf",
      status: "Draft PDF",
      stepId: "application",
      signatureRequired: true,
    },
    {
      id: "model-c-agreement",
      title: "Model C agreement",
      description:
        "Generated agreement using approved application data, prepared for applicant and sponsor signatures.",
      href: "/fiscal-sponsorship/placeholders/model-c-agreement.pdf",
      status: "Needs signature",
      stepId: "agreement",
      signatureRequired: true,
    },
    {
      id: "regrant-request",
      title: "Re-grant request form",
      description:
        "Amount, purpose, budget alignment, documentation, certification, and payment instructions.",
      href: "/fiscal-sponsorship/placeholders/regrant-request.pdf",
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
        "Signs the application acknowledgements, Model C agreement, and re-grant certifications.",
    },
    {
      id: "sponsor",
      role: "Sponsor",
      name: "Coach House Solutions Group, NFP",
      status: "Countersign",
      description:
        "Countersigns the Model C agreement after internal approval and applicant signature.",
    },
  ]
