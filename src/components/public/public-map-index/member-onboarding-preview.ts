export const PUBLIC_MAP_MEMBER_ONBOARDING_QUERY_KEY = "member_onboarding"
export const PUBLIC_MAP_MEMBER_ONBOARDING_ENABLED_VALUE = "1"
export const PUBLIC_MAP_MEMBER_ONBOARDING_PREVIEW_SOURCE = "admin_preview"

type SearchParamsLike = string | URLSearchParams | { toString(): string }

export function isPublicMapMemberOnboardingPreviewActive({
  canPreview,
  memberOnboardingParam,
}: {
  canPreview: boolean
  memberOnboardingParam: string | null
}) {
  return canPreview && memberOnboardingParam === PUBLIC_MAP_MEMBER_ONBOARDING_ENABLED_VALUE
}

export function buildPublicMapMemberOnboardingPreviewHref({
  pathname,
  searchParams,
  enabled,
}: {
  pathname: string
  searchParams: SearchParamsLike
  enabled: boolean
}) {
  const params = new URLSearchParams(searchParams.toString())

  if (enabled) {
    params.set(
      PUBLIC_MAP_MEMBER_ONBOARDING_QUERY_KEY,
      PUBLIC_MAP_MEMBER_ONBOARDING_ENABLED_VALUE,
    )
    params.set("source", PUBLIC_MAP_MEMBER_ONBOARDING_PREVIEW_SOURCE)
  } else {
    params.delete(PUBLIC_MAP_MEMBER_ONBOARDING_QUERY_KEY)
    if (params.get("source") === PUBLIC_MAP_MEMBER_ONBOARDING_PREVIEW_SOURCE) {
      params.delete("source")
    }
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
