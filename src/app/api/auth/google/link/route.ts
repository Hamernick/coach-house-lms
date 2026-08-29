import { randomUUID } from "node:crypto"

import { validateGoogleAccountLink } from "@/features/google-auth"
import { logger } from "@/lib/logger"

function respond(
  result: { ok: boolean; code?: string },
  status: number,
  requestId: string
) {
  const context = {
    capability: "link",
    outcome: result.ok ? "success" : (result.code ?? "unavailable"),
    requestId,
    status,
  }

  if (result.ok) {
    logger.info("google_auth_result", context)
  } else {
    logger.warn("google_auth_result", context)
  }

  return Response.json(result, {
    headers: { "x-request-id": requestId },
    status,
  })
}

export async function POST(request: Request) {
  const requestId = randomUUID()
  let input: unknown

  try {
    input = await request.json()
  } catch {
    return respond({ ok: false, code: "invalid" }, 400, requestId)
  }

  const result = await validateGoogleAccountLink(input)
  const status = result.ok
    ? 200
    : result.code === "invalid"
      ? 400
      : result.code === "unauthorized"
        ? 401
        : result.code === "email_mismatch"
          ? 409
          : 503

  return respond(result, status, requestId)
}
