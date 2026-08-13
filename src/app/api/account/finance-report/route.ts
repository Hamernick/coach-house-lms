import { NextResponse } from "next/server"

import {
  buildWorkspaceFinanceReportDownload,
  type WorkspaceFinanceReportFormat,
} from "@/actions/workspace-finance-report"

export const runtime = "nodejs"

function toResponseBody(body: Uint8Array | string) {
  if (typeof body === "string") return body
  const buffer = new ArrayBuffer(body.byteLength)
  new Uint8Array(buffer).set(body)
  return buffer
}

function resolveFormat(request: Request): WorkspaceFinanceReportFormat | null {
  const format = new URL(request.url).searchParams.get("format")
  return format === "csv" || format === "pdf" ? format : null
}

export async function GET(request: Request) {
  const format = resolveFormat(request)
  if (!format) {
    return NextResponse.json({ error: "Choose CSV or PDF." }, { status: 400 })
  }

  const result = await buildWorkspaceFinanceReportDownload({ format })
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return new NextResponse(toResponseBody(result.body), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Content-Type": result.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
