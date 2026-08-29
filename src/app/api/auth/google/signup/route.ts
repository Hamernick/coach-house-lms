import { randomUUID } from "node:crypto"

import { preprovisionGoogleSignup } from "@/lib/google-auth-provisioning"
import { logger } from "@/lib/logger"

function respond(
  result: { ok: boolean; code?: string },
  status: number,
  requestId: string
) {
  const context = {
    capability: "signup",
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

  const result = await preprovisionGoogleSignup(input)
  const status = result.ok
    ? 200
    : result.code === "invalid"
      ? 400
      : result.code === "existing_account"
        ? 409
        : 503

  return respond(result, status, requestId)
}
