import {
  acceptOrganizationAccessRequestAction,
  declineOrganizationAccessRequestAction,
  listMyOrganizationAccessRequestsAction,
} from "@/app/actions/organization-access"
import { OrganizationAccessRequestsPanel } from "@/features/organization-access"

export const dynamic = "force-dynamic"

export default async function AccessRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const highlightedRequestId =
    typeof resolvedSearchParams?.request === "string"
      ? resolvedSearchParams.request.trim()
      : null

  const result = await listMyOrganizationAccessRequestsAction()
  const requests = "ok" in result ? result.requests : []

  return (
    <OrganizationAccessRequestsPanel
      initialRequests={requests}
      acceptRequestAction={acceptOrganizationAccessRequestAction}
      declineRequestAction={declineOrganizationAccessRequestAction}
      highlightedRequestId={highlightedRequestId}
    />
  )
}
