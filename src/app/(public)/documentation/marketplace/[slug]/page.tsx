import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import {
  MARKETPLACE_RESOURCES,
  MarketplaceResourcePage,
} from "@/features/nonprofit-documentation"

type Props = { params: Promise<{ slug: string }> }

function findResource(slug: string) {
  return MARKETPLACE_RESOURCES.find((resource) => resource.id === slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resource = findResource((await params).slug)
  if (!resource)
    return { title: "Resource not found", robots: { index: false } }
  return {
    title: `${resource.name} | Nonprofit Marketplace`,
    description: resource.description,
    alternates: { canonical: `/documentation/marketplace/${resource.id}` },
  }
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params
  if (slug === "techsoup-product-selection")
    permanentRedirect("/documentation/marketplace/techsoup")
  const resource = findResource(slug)
  if (!resource) notFound()
  return <MarketplaceResourcePage resource={resource} />
}
