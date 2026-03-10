import { notFound, redirect } from "next/navigation"

export const revalidate = 300

export default async function LegacyPublicOrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>
  searchParams?: Promise<{ program?: string | string[] }>
}) {
  const { org } = await params
  const slug = String(org).trim()
  if (!slug) return notFound()

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const programParam = resolvedSearchParams?.program
  const selectedProgramId = (() => {
    if (typeof programParam === "string") return programParam.trim() || null
    if (Array.isArray(programParam)) {
      const first = programParam[0]
      return typeof first === "string" ? first.trim() || null : null
    }
    return null
  })()

  const encodedSlug = encodeURIComponent(slug)
  if (selectedProgramId) {
    const query = new URLSearchParams({ program: selectedProgramId }).toString()
    redirect(`/find/${encodedSlug}?${query}`)
  }

  redirect(`/find/${encodedSlug}`)
}
