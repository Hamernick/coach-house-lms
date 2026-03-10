import { redirect } from "next/navigation"

export const runtime = "edge"
export const revalidate = 86400

export default function LegacyHomeAliasRedirectPage() {
  // Keep the historical /home2 URL stable while using the canonical legacy-home route.
  redirect("/legacy-home")
}
