import { createHmac, randomBytes } from "node:crypto"

import { env } from "@/lib/env"

const localRiskSecret = randomBytes(32).toString("hex")

function riskSecret() {
  if (env.PUBLIC_MAP_CLAIM_RISK_SECRET) return env.PUBLIC_MAP_CLAIM_RISK_SECRET
  if (process.env.NODE_ENV !== "production") return localRiskSecret
  return null
}

export function readPublicMapClaimRiskIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip =
    forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")
  return ip || "unknown"
}

export function hashPublicMapClaimRisk(value: string) {
  const secret = riskSecret()
  if (!secret) return null
  return createHmac("sha256", secret).update(value).digest("hex")
}
