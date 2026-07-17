function hasText(value: string | null) {
  return Boolean(value?.trim())
}

export function buildAdminMemberCompleteness({
  avatarUrl,
  email,
  headline,
  name,
}: {
  avatarUrl: string | null
  email: string | null
  headline: string | null
  name: string
}) {
  const fields = [
    { label: "name", complete: hasText(name) && name !== "Unknown member" },
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
