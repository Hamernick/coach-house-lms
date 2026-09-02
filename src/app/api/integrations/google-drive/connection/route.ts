import { NextResponse, type NextRequest } from "next/server"
import {
  getGoogleDriveConnection,
  requireGoogleDriveContext,
} from "@/features/google-drive"
import {
  googleDriveFailure,
  googleDriveJson,
  googleDriveRequestId,
} from "../route-support"

export async function GET(request: NextRequest) {
  const requestId = googleDriveRequestId()
  try {
    const { user } = await requireGoogleDriveContext(
      request,
      new NextResponse()
    )
    const connection = await getGoogleDriveConnection(user.id)
    return googleDriveJson(
      { ok: true, connection },
      200,
      requestId,
      "connection"
    )
  } catch (error) {
    return googleDriveFailure(error, requestId, "connection")
  }
}
