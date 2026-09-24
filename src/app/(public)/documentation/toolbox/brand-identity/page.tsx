import { redirect } from "next/navigation"

import { BRAND_IDENTITY_PATH } from "@/features/nonprofit-documentation"

export default function LegacyBrandIdentityPage() {
  redirect(BRAND_IDENTITY_PATH)
}
