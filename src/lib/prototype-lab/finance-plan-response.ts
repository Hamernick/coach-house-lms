export const FINANCE_PLAN_RESPONSE_ACTIONS = [
  "confirm",
  "deny",
  "agree",
] as const

export type FinancePlanResponseAction =
  (typeof FINANCE_PLAN_RESPONSE_ACTIONS)[number]

export type FinancePlanResponseState = "in_progress" | "resolved"

export type FinancePlanResponseAttachmentKind = "document" | "image" | "video"

export type FinancePlanResponseAttachment = {
  id: string
  kind: FinancePlanResponseAttachmentKind
  mimeType: string
  name: string
  size: number
  url: string
}

export type FinancePlanResponseLink = {
  href: string
  host: string
  kind: FinancePlanResponseAttachmentKind | "link"
}

export type FinancePlanResponse = {
  action: FinancePlanResponseAction | null
  attachments: FinancePlanResponseAttachment[]
  createdAt: string
  id: string
  links: FinancePlanResponseLink[]
  message: string
  nodeId: string | null
  planId: string
  state: FinancePlanResponseState
  viewId: string
}

const LINK_PATTERN = /https:\/\/[^\s<>"']+/gi
const IMAGE_EXTENSIONS = /\.(?:avif|gif|jpe?g|png|webp)$/i
const VIDEO_EXTENSIONS = /\.(?:m4v|mov|mp4|webm)$/i
const DOCUMENT_EXTENSIONS = /\.(?:csv|docx?|pdf|pptx?|rtf|txt|xlsx?)$/i
const VIDEO_HOSTS = new Set([
  "vimeo.com",
  "www.vimeo.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
])

function trimLinkPunctuation(value: string) {
  return value.replace(/[),.;:[\]}]+$/g, "")
}

export function buildFinancePlanResponseLinks(
  message: string
): FinancePlanResponseLink[] {
  const seen = new Set<string>()

  return (message.match(LINK_PATTERN) ?? [])
    .map(trimLinkPunctuation)
    .flatMap((value) => {
      try {
        const url = new URL(value)
        if (url.protocol !== "https:" || seen.has(url.href)) return []
        seen.add(url.href)

        const path = url.pathname.toLowerCase()
        const kind: FinancePlanResponseLink["kind"] = VIDEO_HOSTS.has(
          url.hostname
        )
          ? "video"
          : IMAGE_EXTENSIONS.test(path)
            ? "image"
            : VIDEO_EXTENSIONS.test(path)
              ? "video"
              : DOCUMENT_EXTENSIONS.test(path)
                ? "document"
                : "link"

        return [{ href: url.href, host: url.hostname, kind }]
      } catch {
        return []
      }
    })
    .slice(0, 6)
}

export function isFinancePlanResponseAction(
  value: unknown
): value is FinancePlanResponseAction {
  return FINANCE_PLAN_RESPONSE_ACTIONS.includes(
    value as FinancePlanResponseAction
  )
}

export function getFinancePlanResponseState(
  action: FinancePlanResponseAction | null
): FinancePlanResponseState {
  return action ? "resolved" : "in_progress"
}
