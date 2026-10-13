import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import {
  importGoogleDriveFile,
  GoogleDriveError,
} from "@/features/google-drive"
import { MAX_DOCUMENT_IMPORT_BYTES } from "../lib"
import { readImportRequest } from "./read-import-request"
import { reserveDocumentImport } from "./import-capacity"
import { DocumentImportError } from "./import-error"
import { convertDocument } from "./convert-document"

export async function prepareDocumentImport(request: NextRequest) {
  const supabase = createSupabaseRouteHandlerClient(request, new NextResponse())
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let release: (() => void) | undefined
  try {
    const organization = await resolveActiveOrganization(supabase, user.id)
    if (!canEditOrganization(organization.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (request.headers.get("sec-fetch-site") === "cross-site")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    release = reserveDocumentImport(user.id)
    const isJson = request.headers
      .get("content-type")
      ?.includes("application/json")
    const body = await readImportRequest(
      request,
      isJson ? 4096 : MAX_DOCUMENT_IMPORT_BYTES + 65536
    )
    if (isJson) {
      const input = (await body.json()) as { driveFileId?: unknown }
      const file = await importGoogleDriveFile({
        userId: user.id,
        fileId: input.driveFileId,
      })
      const document = await convertDocument(file)
      return NextResponse.json(
        { document: { ...document, sourceUrl: file.sourceUrl } },
        { headers: { "Cache-Control": "private, no-store" } }
      )
    }
    const form = await body.formData()
    const file = form.get("file")
    if (!(file instanceof File) || file.size > MAX_DOCUMENT_IMPORT_BYTES)
      return NextResponse.json(
        { error: "Choose a document up to 15 MB." },
        { status: 400 }
      )
    const document = await convertDocument({
      name: file.name,
      bytes: Buffer.from(await file.arrayBuffer()),
    })
    return NextResponse.json(
      { document },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    if (error instanceof GoogleDriveError)
      return NextResponse.json(
        {
          error:
            error.status === 413
              ? "Choose a document up to 15 MB."
              : error.code === "invalid"
                ? "Choose a Google Doc, Word (.docx or .doc), or Markdown file."
                : "Google Drive could not provide this file. Check your connection and file access.",
          code: error.code,
        },
        { status: error.status }
      )
    return NextResponse.json(
      {
        error:
          error instanceof DocumentImportError
            ? error.message
            : "This document could not be imported.",
      },
      { status: error instanceof DocumentImportError ? error.status : 400 }
    )
  } finally {
    release?.()
  }
}
