import type { Metadata } from "next"

import { LegalDocumentPage, TERMS_DOCUMENT } from "@/features/legal-consent"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing access to Coach House services, accounts, content, billing, and acceptable use.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return <LegalDocumentPage document={TERMS_DOCUMENT} />
}
