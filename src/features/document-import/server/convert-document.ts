import mammoth from "mammoth"
import WordExtractor from "word-extractor"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { plainTextToNarrativeHtml } from "@/lib/roadmap/organization-narratives"
import { MAX_DOCUMENT_IMPORT_BYTES, MAX_DOCUMENT_IMPORT_HTML } from "../lib"
import type { ImportedDocument } from "../types"
import { DocumentImportError } from "./import-error"
import { validateLegacyWord } from "./validate-legacy-word"
import { validateDocxArchive } from "./validate-docx-archive"

export async function convertDocument({
  name,
  bytes,
}: {
  name: string
  bytes: Buffer
}): Promise<ImportedDocument> {
  if (!bytes.length || bytes.length > MAX_DOCUMENT_IMPORT_BYTES)
    throw new DocumentImportError("Choose a non-empty document up to 15 MB.")
  let html: string
  const warnings: string[] = []
  if (/\.docx$/i.test(name)) {
    await validateDocxArchive(bytes)
    const result = await mammoth.convertToHtml(
      { buffer: bytes },
      {
        externalFileAccess: false,
        includeEmbeddedStyleMap: false,
        styleMap: ["u => u", "strike => s"],
        convertImage: mammoth.images.imgElement(async () => {
          if (
            !warnings.includes(
              "Embedded images were omitted. Add images using the editor's image button."
            )
          )
            warnings.push(
              "Embedded images were omitted. Add images using the editor's image button."
            )
          return { src: "" }
        }),
      }
    )
    html = result.value
    if (result.messages.length)
      warnings.push(
        "Some Word formatting was simplified. Review the preview before importing."
      )
  } else if (/\.doc$/i.test(name)) {
    if (bytes.subarray(0, 8).toString("hex") !== "d0cf11e0a1b11ae1")
      throw new DocumentImportError(
        "This is not a supported Word .doc file. Save it as .docx and try again."
      )
    validateLegacyWord(bytes)
    const document = await new WordExtractor().extract(bytes)
    html = plainTextToNarrativeHtml(document.getBody())
    warnings.push(
      "Legacy .doc files import as text. Use .docx to retain supported formatting."
    )
  } else if (/\.(md|markdown)$/i.test(name)) {
    const { marked } = await import("marked")
    const markdown = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    html = await marked.parse(markdown, { async: false, gfm: true })
  } else {
    throw new DocumentImportError(
      "Choose a Word (.docx or .doc) or Markdown (.md) document."
    )
  }
  if (html.length > MAX_DOCUMENT_IMPORT_HTML)
    throw new DocumentImportError(
      "This document is too long to import. Split it into smaller documents."
    )
  if (/<img\b/i.test(html) && warnings.length === 0)
    warnings.push(
      "Embedded images were omitted. Add images using the editor's image button."
    )
  html = sanitizeHtml(html).replace(/<img\b[^>]*>/gi, "")
  if (!html.replace(/<[^>]*>/g, "").trim())
    throw new DocumentImportError(
      "No editable text was found in this document."
    )
  return { name, html, warnings }
}
