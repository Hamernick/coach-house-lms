import type { Metadata } from "next"

import { LegalDocumentPage, PRIVACY_DOCUMENT } from "@/features/legal-consent"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Coach House collects, uses, discloses, retains, and protects personal information.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return <LegalDocumentPage document={PRIVACY_DOCUMENT} />
}
