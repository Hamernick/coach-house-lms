import { NextResponse, type NextRequest } from "next/server"

import { buildFiscalSponsorshipSigningPreview } from "@/features/fiscal-sponsorship"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packetId: string }> }
) {
  try {
    const response = NextResponse.next()
    const supabase = createSupabaseRouteHandlerClient(request, response)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { packetId } = await params
    const result = await buildFiscalSponsorshipSigningPreview(packetId)
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 403 })
    }

    return new Response(Buffer.from(result.bytes), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition":
          'inline; filename="form-b-fiscal-sponsorship-agreement.pdf"',
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
        "X-Document-SHA256": result.sha256,
      },
    })
  } catch {
    return Response.json(
      { error: "Unable to render the Form B preview." },
      { status: 500 }
    )
  }
}
