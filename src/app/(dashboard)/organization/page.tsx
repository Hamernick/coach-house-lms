import { redirect } from "next/navigation"

import type { MyOrganizationSearchParams } from "../my-organization/_lib/types"
import { buildWorkspaceAliasRedirectDestination } from "../_lib/workspace-route-aliases"

export default async function LegacyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<MyOrganizationSearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  redirect(buildWorkspaceAliasRedirectDestination(resolvedSearchParams))
}
