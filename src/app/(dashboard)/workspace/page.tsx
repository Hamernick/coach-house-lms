import MyOrganizationPageContent from "../my-organization/_lib/my-organization-page-content"

import type { MyOrganizationSearchParams } from "../my-organization/_lib/types"

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<MyOrganizationSearchParams>
}) {
  return MyOrganizationPageContent({
    searchParams,
  })
}
