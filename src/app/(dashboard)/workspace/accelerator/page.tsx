import MyOrganizationPageContent from "../../my-organization/_lib/my-organization-page-content"
import type { MyOrganizationSearchParams } from "../../my-organization/_lib/types"

export default async function WorkspaceAcceleratorPage({
  searchParams,
}: {
  searchParams?: Promise<MyOrganizationSearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  return MyOrganizationPageContent({
    searchParams: Promise.resolve({
      ...(resolvedSearchParams ?? {}),
      view: "accelerator",
    }),
  })
}
