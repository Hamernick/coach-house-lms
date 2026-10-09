import Heart from "lucide-react/dist/esm/icons/heart"

import { Button } from "@/components/ui/button"
import { normalizeExternalUrl } from "@/lib/organization/urls"

export function OrgProfileDonationLink({ href }: { href?: string | null }) {
  const normalized = normalizeExternalUrl(href)
  if (!normalized) return null

  let url: URL
  try {
    url = new URL(normalized)
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
  } catch {
    return null
  }

  return (
    <Button asChild size="sm" variant="secondary" className="shadow-none">
      <a href={url.href} target="_blank" rel="noopener noreferrer">
        <Heart aria-hidden="true" />
        Donate
      </a>
    </Button>
  )
}
