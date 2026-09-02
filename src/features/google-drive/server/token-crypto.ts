import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { env } from "@/lib/env"
import { GoogleDriveError } from "../types"

export type EncryptedSecret = {
  ciphertext: string
  iv: string
  authTag: string
  keyVersion: string
}

function getKey(version?: string) {
  const currentVersion = env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_CURRENT_VERSION
  if (!env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEYS || !currentVersion) {
    throw new GoogleDriveError("not_configured", 503)
  }
  let keys: Record<string, unknown>
  try {
    keys = JSON.parse(env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEYS) as Record<string, unknown>
  } catch {
    throw new GoogleDriveError("not_configured", 503)
  }
  const keyVersion = version ?? currentVersion
  const encoded = keys[keyVersion]
  if (typeof encoded !== "string") throw new GoogleDriveError("not_configured", 503)
  const key = Buffer.from(encoded, "base64")
  if (key.length !== 32) throw new GoogleDriveError("not_configured", 503)
  return { key, keyVersion }
}

export function encryptGoogleDriveSecret(value: string, aad: string): EncryptedSecret {
  const { key, keyVersion } = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  cipher.setAAD(Buffer.from(aad))
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion,
  }
}

export function decryptGoogleDriveSecret(secret: EncryptedSecret, aad: string) {
  const { key } = getKey(secret.keyVersion)
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(secret.iv, "base64"))
    decipher.setAAD(Buffer.from(aad))
    decipher.setAuthTag(Buffer.from(secret.authTag, "base64"))
    return Buffer.concat([
      decipher.update(Buffer.from(secret.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    throw new GoogleDriveError("provider_unavailable", 503)
  }
}
