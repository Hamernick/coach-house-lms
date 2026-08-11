import type { Metadata } from "next"

import { LegalDocumentPage, TERMS_DOCUMENT } from "@/features/legal-consent"

export const metadata: Metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return <LegalDocumentPage document={TERMS_DOCUMENT} />
}
