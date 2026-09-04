import { NextResponse, type NextRequest } from "next/server"
import {
  requireGoogleDriveContext,
  startGoogleDriveConnection,
} from "@/features/google-drive"
import {
  googleDriveFailure,
  googleDriveJson,
  googleDriveRequestId,
} from "../route-support"

export async function POST(request: NextRequest) {
  const requestId = googleDriveRequestId()
  const response = new NextResponse()
  try {
    const { user, organization } = await requireGoogleDriveContext(
      request,
      response,
      true
    )
    const input = (await request.json().catch(() => ({}))) as {
      returnPath?: unknown
    }
    const authorizationUrl = await startGoogleDriveConnection({
      userId: user.id,
      orgId: organization.orgId,
      returnPath: input.returnPath,
    })
    return googleDriveJson(
      { ok: true, authorizationUrl },
      200,
      requestId,
      "connect"
    )
  } catch (error) {
    return googleDriveFailure(error, requestId, "connect")
  }
}
