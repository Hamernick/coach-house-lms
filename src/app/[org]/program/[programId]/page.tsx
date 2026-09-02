import { notFound, redirect } from "next/navigation"

import { buildFindOrganizationHref } from "@/lib/find/routes"

export const revalidate = 300

export default async function PublicProgramRedirectPage({
  params,
}: {
  params: Promise<{ org: string; programId: string }>
}) {
  const { org, programId } = await params
  if (!org || !programId) return notFound()

  redirect(
    buildFindOrganizationHref(org, new URLSearchParams({ program: programId }))
  )
}
