import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { GoogleDriveError } from "@/features/google-drive"

export function googleDriveRequestId() {
  return randomUUID()
}

export function googleDriveJson(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
  capability: string
) {
  logger[status < 400 ? "info" : "warn"]("google_drive_result", {
    capability,
    outcome: status < 400 ? "success" : String(body.code ?? "error"),
    requestId,
    status,
  })
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-request-id": requestId },
  })
}

export function googleDriveFailure(
  error: unknown,
  requestId: string,
  capability: string
) {
  const normalized =
    error instanceof GoogleDriveError
      ? error
      : new GoogleDriveError("provider_unavailable", 503)
  return googleDriveJson(
    { ok: false, code: normalized.code },
    normalized.status,
    requestId,
    capability
  )
}
