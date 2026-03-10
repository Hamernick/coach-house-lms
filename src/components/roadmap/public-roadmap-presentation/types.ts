export type PublicRoadmapSection = {
  id: string
  slug: string
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  contentHtml: string
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export type PublicRoadmapPresentationProps = {
  orgName: string
  subtitle: string
  orgSlug: string
  logoUrl?: string | null
  shareUrl: string
  sections: PublicRoadmapSection[]
}
