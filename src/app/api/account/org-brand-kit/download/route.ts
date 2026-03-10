import { NextResponse } from "next/server"

import { buildAccountBrandKitDownload } from "@/lib/organization/brand-kit-download"

export const runtime = "nodejs"

export async function GET() {
  const result = await buildAccountBrandKitDownload()
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return new NextResponse(result.archive, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
