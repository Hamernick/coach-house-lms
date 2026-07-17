function hasText(value: string | null) {
  return Boolean(value?.trim())
}

export function buildAdminMemberCompleteness({
  avatarUrl,
  email,
  fullName,
  headline,
}: {
  avatarUrl: string | null
  email: string | null
  fullName: string | null
  headline: string | null
}) {
  const fields = [
    { label: "name", complete: hasText(fullName) },
    { label: "email", complete: hasText(email) },
    { label: "headline", complete: hasText(headline) },
    { label: "profile photo", complete: hasText(avatarUrl) },
  ]
  const completed = fields.filter((field) => field.complete).length

  return {
    profileCompletenessPercent: Math.round((completed / fields.length) * 100),
    profileCompletedCount: completed,
    profileTotalCount: fields.length,
    profileMissingFields: fields
      .filter((field) => !field.complete)
      .map((field) => field.label),
  }
}
