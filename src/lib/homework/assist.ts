const MAX_SNIPPET_LENGTH = 160

type AssistContext = {
  fieldLabel: string
  promptContext: string
  classTitle?: string
  moduleTitle?: string
  currentAnswer?: string
  orgProfile?: Record<string, unknown> | null
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const summarize = (value: string | undefined) => {
  if (!value) return ""
  const trimmed = value.replace(/<[^>]+>/g, "").trim()
  if (trimmed.length <= MAX_SNIPPET_LENGTH) {
    return trimmed
  }
  return `${trimmed.slice(0, MAX_SNIPPET_LENGTH)}…`
}

export async function generateHomeworkSuggestion(context: AssistContext): Promise<string> {
  const orgName =
    typeof context.orgProfile?.name === "string" && context.orgProfile.name.trim().length > 0
      ? context.orgProfile.name.trim()
      : "your organization"
  const fieldLabel = context.fieldLabel || "this prompt"
  const moduleLabel = context.moduleTitle ?? "this module"
  const classLabel = context.classTitle ?? "the accelerator"
  const prior = summarize(context.currentAnswer)

  const intro = escapeHtml(
    `Drafting ${fieldLabel.toLowerCase()} for ${orgName} — framed around ${moduleLabel} in ${classLabel}.`,
  )

  const body = prior
    ? `You previously highlighted: <em>${escapeHtml(prior)}</em>. Build on that with a vivid narrative that names the community, the change you are driving, and what success looks like in the next 6–12 months.`
    : `Start with a vivid hook about the community you serve, explain why the problem is urgent now, and close with the impact you expect over the next 6–12 months.`

  const callToAction =
    context.promptContext && context.promptContext !== fieldLabel
      ? `Tie this back to <strong>${escapeHtml(context.promptContext)}</strong> so it flows directly into the Strategic Roadmap.`
      : "Use short paragraphs so mentors can leave fast feedback."

  return `<p>${intro}</p><p>${body}</p><p>${callToAction}</p>`
}
