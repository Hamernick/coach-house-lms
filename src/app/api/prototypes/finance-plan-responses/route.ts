import { NextResponse, type NextRequest } from "next/server"

import {
  FinancePlanResponseInboxError,
  listFinancePlanResponses,
  readFinancePlanResponseAttachment,
  saveFinancePlanResponse,
} from "@/lib/admin/finance-plan-response-inbox"
import {
  isFinancePlanResponseAction,
  type FinancePlanResponseAction,
} from "@/lib/prototype-lab/finance-plan-response"
import { requireAdmin } from "@/lib/admin/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function readField(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function errorResponse(error: unknown) {
  if (error instanceof FinancePlanResponseInboxError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  console.error("[finance-plan-responses] Request failed.", error)
  return NextResponse.json(
    { error: "Unable to save the reply." },
    { status: 500 }
  )
}

export async function GET(request: NextRequest) {
  await requireAdmin()

  try {
    const responseId = request.nextUrl.searchParams.get("responseId")
    const attachmentId = request.nextUrl.searchParams.get("attachmentId")

    if (responseId || attachmentId) {
      if (!responseId || !attachmentId) {
        return NextResponse.json(
          { error: "Response and attachment are required." },
          { status: 400 }
        )
      }

      const result = await readFinancePlanResponseAttachment(
        responseId,
        attachmentId
      )
      const disposition =
        result.attachment.kind === "document" ? "attachment" : "inline"

      return new Response(new Uint8Array(result.bytes), {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(result.attachment.name)}`,
          "Content-Type": result.attachment.mimeType,
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    return NextResponse.json(
      { responses: await listFinancePlanResponses() },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  await requireAdmin()

  try {
    const formData = await request.formData()
    const rawAction = readField(formData, "action")
    const action: FinancePlanResponseAction | null = rawAction
      ? isFinancePlanResponseAction(rawAction)
        ? rawAction
        : null
      : null

    if (rawAction && !action) {
      return NextResponse.json({ error: "Action is invalid." }, { status: 400 })
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    const response = await saveFinancePlanResponse({
      action,
      files,
      message: readField(formData, "message"),
      nodeId: readField(formData, "nodeId") || null,
      planId: readField(formData, "planId"),
      viewId: readField(formData, "viewId"),
    })

    return NextResponse.json({ response }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
