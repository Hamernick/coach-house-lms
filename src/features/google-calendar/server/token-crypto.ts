import "server-only"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { env } from "@/lib/env"
import { CalendarError, type EncryptedCalendarSecret } from "../types"
function encryptionKey(version?: string) {
  try {
    const keyVersion =
      version ?? env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_CURRENT_VERSION
    const keys = JSON.parse(
      env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEYS ?? "{}"
    ) as Record<string, string>
    if (!keyVersion || typeof keys[keyVersion] !== "string") throw new Error()
    const key = Buffer.from(keys[keyVersion], "base64")
    if (key.length !== 32) throw new Error()
    return { key, keyVersion }
  } catch {
    throw new CalendarError("not_configured", 503)
  }
}
export function encryptCalendarSecret(
  value: string,
  aad: string
): EncryptedCalendarSecret {
  const { key, keyVersion } = encryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  cipher.setAAD(Buffer.from(aad))
  return {
    ciphertext: Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]).toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion,
  }
}
export function decryptCalendarSecret(
  secret: EncryptedCalendarSecret,
  aad: string
) {
  const { key } = encryptionKey(secret.keyVersion)
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(secret.iv, "base64")
    )
    decipher.setAAD(Buffer.from(aad))
    decipher.setAuthTag(Buffer.from(secret.authTag, "base64"))
    return Buffer.concat([
      decipher.update(Buffer.from(secret.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    throw new CalendarError("reconnect_required", 409)
  }
}
