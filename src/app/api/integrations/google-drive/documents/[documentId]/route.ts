import { NextResponse, type NextRequest } from "next/server"
import {
  detachGoogleDriveDocument,
  requireGoogleDriveContext,
} from "@/features/google-drive"
import {
  googleDriveFailure,
  googleDriveJson,
  googleDriveRequestId,
} from "../../route-support"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestId = googleDriveRequestId()
  try {
    const { organization } = await requireGoogleDriveContext(
      request,
      new NextResponse(),
      true
    )
    const { documentId } = await params
    await detachGoogleDriveDocument(documentId, organization.orgId)
    return googleDriveJson({ ok: true }, 200, requestId, "documents_detach")
  } catch (error) {
    return googleDriveFailure(error, requestId, "documents_detach")
  }
}
