import { redirect } from "next/navigation"

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
  redirect(
    highlightedRequestId
      ? `/notifications?request=${encodeURIComponent(highlightedRequestId)}`
      : "/notifications",
  )
}
