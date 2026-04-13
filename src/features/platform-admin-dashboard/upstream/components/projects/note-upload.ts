import type { NoteType } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"

export type UploadedNoteAsset = {
  id: string
  name: string
  url: string
}

export type NoteUploadKind = "audio" | "files"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function hasHtmlNoteContent(value: string | undefined) {
  if (!value) return false
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function textToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`,
    )
    .join("")
}

function normalizeExistingContent(value: string | undefined) {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return ""
  if (hasHtmlNoteContent(trimmed)) {
    return trimmed
  }
  return textToHtml(trimmed)
}

function buildAttachmentHeading(kind: NoteUploadKind, count: number) {
  if (kind === "audio") {
    return count === 1 ? "Uploaded audio file" : "Uploaded audio files"
  }

  return count === 1 ? "Attached file" : "Attached files"
}

function buildDefaultTitle(kind: NoteUploadKind, assets: UploadedNoteAsset[]) {
  if (assets.length === 1) {
    return assets[0]?.name.trim() || (kind === "audio" ? "Audio note" : "File note")
  }

  return kind === "audio" ? "Audio note" : "Files note"
}

export function buildNotePayloadForUploadedAssets({
  assets,
  draftContent,
  draftTitle,
  kind,
  previousNoteType,
}: {
  assets: UploadedNoteAsset[]
  draftContent?: string
  draftTitle?: string
  kind: NoteUploadKind
  previousNoteType?: NoteType
}): {
  content: string
  noteType: NoteType
  title: string
} {
  const sanitizedAssets = assets
    .map((asset) => ({
      id: asset.id,
      name: asset.name.trim(),
      url: asset.url.trim(),
    }))
    .filter((asset) => asset.name && asset.url)

  const baseContent = normalizeExistingContent(draftContent)
  const attachmentHeading = buildAttachmentHeading(kind, sanitizedAssets.length)
  const attachmentList = sanitizedAssets
    .map(
      (asset) =>
        `<li><a href="${escapeHtml(asset.url)}" target="_blank" rel="noreferrer">${escapeHtml(asset.name)}</a></li>`,
    )
    .join("")
  const attachmentBlock = [
    `<p><strong>${escapeHtml(attachmentHeading)}:</strong></p>`,
    `<ul>${attachmentList}</ul>`,
  ].join("")

  return {
    title: draftTitle?.trim() || buildDefaultTitle(kind, sanitizedAssets),
    content: `${baseContent}${attachmentBlock}`.trim(),
    noteType: kind === "audio" || previousNoteType === "audio" ? "audio" : "general",
  }
}
