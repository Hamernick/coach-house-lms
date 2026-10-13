import { notFound, redirect } from "next/navigation"

export const revalidate = 300

export default async function PublicProgramRedirectPage({
  params,
}: {
  params: Promise<{ org: string; programId: string }>
}) {
  const { org, programId } = await params
  if (!org || !programId) return notFound()

  const encodedOrg = encodeURIComponent(org)
  const query = new URLSearchParams({ program: programId }).toString()
  redirect(`/find/${encodedOrg}?${query}`)
}
