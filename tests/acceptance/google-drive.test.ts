import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  normalizeGoogleDriveFileIds,
  normalizeGoogleDriveOAuthCallbackInput,
  normalizeGoogleDriveReturnPath,
  normalizeGoogleDriveWebViewLink,
} from "@/features/google-drive/lib"

const ROOT = process.cwd()
const readSource = (path: string) => readFileSync(join(ROOT, path), "utf8")
const migration = readSource(
  "supabase/migrations/20260831203000_add_google_drive_documents.sql"
)

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

function stubGoogleDriveServerConfig() {
  vi.stubEnv("GOOGLE_DRIVE_ENABLED", "true")
  vi.stubEnv("GOOGLE_DRIVE_CLIENT_ID", "client-id")
  vi.stubEnv("GOOGLE_DRIVE_CLIENT_SECRET", "client-secret")
  vi.stubEnv(
    "GOOGLE_DRIVE_REDIRECT_URI",
    "https://coachhouse.app/api/integrations/google-drive/callback"
  )
  vi.stubEnv("GOOGLE_DRIVE_PICKER_API_KEY", "picker-developer-key")
  vi.stubEnv("GOOGLE_DRIVE_PICKER_APP_ID", "74627119265")
}

describe("Google Drive backend contract", () => {
  it("accepts only bounded, unique Picker file IDs", () => {
    expect(normalizeGoogleDriveFileIds(["abcdefghij", "ABC_123-xyz"])).toEqual([
      "abcdefghij",
      "ABC_123-xyz",
    ])
    expect(normalizeGoogleDriveFileIds(["abcdefghij", "abcdefghij"])).toBeNull()
    expect(normalizeGoogleDriveFileIds(["short"])).toBeNull()
    expect(
      normalizeGoogleDriveFileIds(
        Array.from({ length: 21 }, (_, index) => `drive-file-${index}`)
      )
    ).toBeNull()
  })

  it("stores only safe Google HTTPS view links", () => {
    expect(
      normalizeGoogleDriveWebViewLink("https://docs.google.com/document/d/abc")
    ).toBe("https://docs.google.com/document/d/abc")
    expect(
      normalizeGoogleDriveWebViewLink("http://docs.google.com/document/d/abc")
    ).toBeNull()
    expect(
      normalizeGoogleDriveWebViewLink("https://google.com.evil.example/file")
    ).toBeNull()
  })

  it("bounds callback inputs and redirects only to Documents routes", () => {
    const state = "a".repeat(43)
    expect(
      normalizeGoogleDriveOAuthCallbackInput(state, "4/authorization-code")
    ).toEqual({
      state,
      code: "4/authorization-code",
    })
    expect(normalizeGoogleDriveOAuthCallbackInput("short", "code")).toBeNull()
    expect(
      normalizeGoogleDriveOAuthCallbackInput(state, "code\nvalue")
    ).toBeNull()
    expect(
      normalizeGoogleDriveOAuthCallbackInput(state, "x".repeat(4097))
    ).toBeNull()
    expect(normalizeGoogleDriveReturnPath("/workspace/documents")).toBe(
      "/workspace/documents"
    )
    expect(normalizeGoogleDriveReturnPath("/workspace?drawer=tools")).toBe(
      "/workspace?drawer=tools"
    )
    expect(normalizeGoogleDriveReturnPath("/api/account/delete")).toBe(
      "/organization/documents"
    )
    expect(normalizeGoogleDriveReturnPath("//evil.example")).toBe(
      "/organization/documents"
    )
  })

  it("keeps OAuth credentials service-only and forces RLS", () => {
    for (const table of [
      "google_drive_oauth_intents",
      "google_drive_connections",
      "organization_external_documents",
    ]) {
      expect(migration).toContain(
        `alter table public.${table} force row level security`
      )
    }
    expect(migration).toContain(
      "revoke all on public.google_drive_oauth_intents from anon, authenticated"
    )
    expect(migration).toContain(
      "revoke all on public.google_drive_connections from anon, authenticated"
    )
    expect(migration).toContain(
      "grant select on public.organization_external_documents to authenticated"
    )
    expect(migration).not.toContain(
      "grant select on public.google_drive_connections to authenticated"
    )
  })

  it("limits metadata reads to owners and organization members", () => {
    expect(migration).toContain("org_id = (select auth.uid())")
    expect(migration).toContain("membership.member_id = (select auth.uid())")
    expect(migration).toContain("unique (org_id, provider, provider_file_id)")
  })

  it("uses selected-file scope, PKCE, and encrypted refresh-token storage", () => {
    const config = readSource("src/features/google-drive/server/config.ts")
    const service = readSource("src/features/google-drive/server/service.ts")
    const googleApi = readSource(
      "src/features/google-drive/server/google-api.ts"
    )
    const crypto = readSource(
      "src/features/google-drive/server/token-crypto.ts"
    )
    expect(config).toContain("https://www.googleapis.com/auth/drive.file")
    expect(service).toContain('code_challenge_method: "S256"')
    expect(service).not.toContain(
      "https://www.googleapis.com/auth/drive.readonly"
    )
    expect(googleApi).toContain("payload.email_verified !== true")
    expect(crypto).toContain('createCipheriv("aes-256-gcm"')
    expect(crypto).toContain("cipher.setAAD")
    expect(migration).not.toMatch(/\baccess_token\b/)
  })

  it("round-trips secrets only with the matching authenticated context", async () => {
    vi.stubEnv(
      "GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEYS",
      JSON.stringify({ v1: Buffer.alloc(32, 7).toString("base64") })
    )
    vi.stubEnv("GOOGLE_DRIVE_TOKEN_ENCRYPTION_CURRENT_VERSION", "v1")
    const { decryptGoogleDriveSecret, encryptGoogleDriveSecret } =
      await import("@/features/google-drive/server/token-crypto")
    const encrypted = encryptGoogleDriveSecret("refresh-token", "user-1")
    expect(encrypted.ciphertext).not.toContain("refresh-token")
    expect(decryptGoogleDriveSecret(encrypted, "user-1")).toBe("refresh-token")
    expect(() => decryptGoogleDriveSecret(encrypted, "user-2")).toThrow(
      "provider_unavailable"
    )
  })

  it("bounds provider requests and maps revoked refresh tokens", async () => {
    stubGoogleDriveServerConfig()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_grant" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const { refreshGoogleDriveAccessToken } =
      await import("@/features/google-drive/server/google-api")

    await expect(
      refreshGoogleDriveAccessToken("refresh-token")
    ).rejects.toMatchObject({
      code: "google_revoked",
      status: 409,
    })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://oauth2.googleapis.com/token")
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(String(init.body)).toContain("grant_type=refresh_token")
  })

  it("rejects unsafe or incorrectly scoped OAuth redirect configuration", async () => {
    stubGoogleDriveServerConfig()
    vi.stubEnv("GOOGLE_DRIVE_REDIRECT_URI", "http://evil.example/callback")
    let config = await import("@/features/google-drive/server/config")
    expect(() => config.getGoogleDriveConfig()).toThrow("not_configured")

    vi.resetModules()
    vi.stubEnv(
      "GOOGLE_DRIVE_REDIRECT_URI",
      "http://localhost:3000/api/integrations/google-drive/callback"
    )
    config = await import("@/features/google-drive/server/config")
    expect(config.getGoogleDriveConfig().redirectUri).toBe(
      "http://localhost:3000/api/integrations/google-drive/callback"
    )
  })

  it("keeps Picker configuration server-owned and validates the App ID", async () => {
    stubGoogleDriveServerConfig()
    let config = await import("@/features/google-drive/server/config")
    expect(config.getGoogleDrivePickerConfig()).toEqual({
      developerKey: "picker-developer-key",
      appId: "74627119265",
    })

    vi.resetModules()
    vi.stubEnv("GOOGLE_DRIVE_PICKER_APP_ID", "not-a-project-number")
    config = await import("@/features/google-drive/server/config")
    expect(() => config.getGoogleDrivePickerConfig()).toThrow("not_configured")
  })

  it("rejects inaccessible files and Drive folders", async () => {
    stubGoogleDriveServerConfig()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "drive-file-folder",
            name: "Folder",
            mimeType: "application/vnd.google-apps.folder",
            webViewLink: "https://drive.google.com/drive/folders/test",
          }),
          { status: 200 }
        )
      )
    vi.stubGlobal("fetch", fetchMock)
    const { getGoogleDriveFile } =
      await import("@/features/google-drive/server/google-api")

    await expect(
      getGoogleDriveFile("access-token", "drive-file-denied")
    ).rejects.toMatchObject({ code: "file_not_authorized", status: 403 })
    await expect(
      getGoogleDriveFile("access-token", "drive-file-folder")
    ).rejects.toMatchObject({ code: "file_not_authorized", status: 403 })
  })

  it("limits UI scope to connection management", () => {
    const connection = readSource(
      "src/features/workspace-tools/components/google-drive-connection.tsx"
    )
    expect(connection).toContain("Google Drive connected")
    expect(connection).toContain("Disconnect Google Drive?")
    expect(connection).not.toContain("picker-token")
    expect(connection).not.toContain("GooglePicker")
  })
})
