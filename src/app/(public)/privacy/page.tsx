import type { Metadata } from "next"

import { LegalDocumentPage, PRIVACY_DOCUMENT } from "@/features/legal-consent"

export const metadata: Metadata = { title: "Privacy Policy" }

export default function PrivacyPage() {
  return <LegalDocumentPage document={PRIVACY_DOCUMENT} />
}
