"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "@/lib/toast"
import type { DocumentActionOptions } from "./use-documents-library-selection"

export type DriveLibraryDocument = {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  modifiedAt: string | null
  status: "available" | "trashed" | "inaccessible" | "needs_reconnect"
}

type DriveResponse = {
  ok?: boolean
  code?: string
  authorizationUrl?: string
  connection?: { connected: boolean }
  documents?: DriveLibraryDocument[]
  attached?: number
  accessToken?: string
  developerKey?: string
  appId?: string
}

type PickerDocument = { id?: string }
type PickerData = { action?: string; docs?: PickerDocument[] }
type PickerInstance = { setVisible: (visible: boolean) => void }
type PickerBuilder = {
  addView: (view: unknown) => PickerBuilder
  enableFeature: (feature: string) => PickerBuilder
  setAppId: (appId: string) => PickerBuilder
  setCallback: (callback: (data: PickerData) => void) => PickerBuilder
  setDeveloperKey: (key: string) => PickerBuilder
  setOAuthToken: (token: string) => PickerBuilder
  build: () => PickerInstance
}
type PickerNamespace = {
  Action: { PICKED: string }
  Feature: { MULTISELECT_ENABLED: string }
  ViewId: { DOCS: string }
  DocsView: new (viewId: string) => unknown
  PickerBuilder: new () => PickerBuilder
}

type PickerWindow = Window & {
  gapi?: { load: (api: string, callback: () => void) => void }
  google?: { picker?: PickerNamespace }
}

let pickerScriptPromise: Promise<void> | null = null

function loadPickerScript() {
  const pickerWindow = window as PickerWindow
  if (pickerWindow.gapi && pickerWindow.google?.picker) {
    return Promise.resolve()
  }
  if (pickerScriptPromise) return pickerScriptPromise

  pickerScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-picker="true"]'
    )
    const script = existing ?? document.createElement("script")
    const loadPicker = () => {
      if (!pickerWindow.gapi) {
        reject(new Error("provider_unavailable"))
        return
      }
      pickerWindow.gapi.load("picker", resolve)
    }

    if (existing) {
      existing.addEventListener("load", loadPicker, { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("provider_unavailable")),
        { once: true }
      )
      return
    }

    script.src = "https://apis.google.com/js/api.js"
    script.async = true
    script.dataset.googlePicker = "true"
    script.addEventListener("load", loadPicker, { once: true })
    script.addEventListener(
      "error",
      () => reject(new Error("provider_unavailable")),
      { once: true }
    )
    document.head.append(script)
  })

  return pickerScriptPromise
}

async function readDriveResponse(response: Response) {
  return (await response.json().catch(() => null)) as DriveResponse | null
}

function driveErrorMessage(code?: string) {
  if (code === "not_configured") return "Google Drive is not available yet."
  if (code === "forbidden")
    return "Only organization admins can add Drive files."
  if (code === "google_revoked" || code === "missing_refresh_token") {
    return "Reconnect Google Drive to continue."
  }
  return "Google Drive could not be reached. Try again."
}

export function useGoogleDriveLibrary({ enabled }: { enabled: boolean }) {
  const [documents, setDocuments] = useState<DriveLibraryDocument[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [connectionResponse, documentsResponse] = await Promise.all([
        fetch("/api/integrations/google-drive/connection", {
          cache: "no-store",
        }),
        fetch("/api/integrations/google-drive/documents", {
          cache: "no-store",
        }),
      ])
      const connectionResult = await readDriveResponse(connectionResponse)
      const documentsResult = await readDriveResponse(documentsResponse)
      setConnected(Boolean(connectionResult?.connection?.connected))
      setDocuments(documentsResult?.documents ?? [])
    } catch {
      setConnected(false)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const attachSelectedFiles = useCallback(
    async (fileIds: string[]) => {
      const response = await fetch("/api/integrations/google-drive/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileIds }),
      })
      const result = await readDriveResponse(response)
      if (!response.ok || typeof result?.attached !== "number") {
        throw new Error(result?.code ?? "provider_unavailable")
      }
      toast.success(
        result.attached === 1
          ? "Google Drive file added"
          : `${result.attached} Google Drive files added`
      )
      await refresh()
    },
    [refresh]
  )

  const openPicker = useCallback(async () => {
    const tokenResponse = await fetch(
      "/api/integrations/google-drive/picker-token",
      { method: "POST" }
    )
    const token = await readDriveResponse(tokenResponse)
    if (
      !tokenResponse.ok ||
      !token?.accessToken ||
      !token.developerKey ||
      !token.appId
    ) {
      throw new Error(token?.code ?? "provider_unavailable")
    }

    await loadPickerScript()
    const picker = (window as PickerWindow).google?.picker
    if (!picker) throw new Error("provider_unavailable")

    const view = new picker.DocsView(picker.ViewId.DOCS)
    const instance = new picker.PickerBuilder()
      .addView(view)
      .enableFeature(picker.Feature.MULTISELECT_ENABLED)
      .setAppId(token.appId)
      .setDeveloperKey(token.developerKey)
      .setOAuthToken(token.accessToken)
      .setCallback((data) => {
        if (data.action !== picker.Action.PICKED) return
        const fileIds = (data.docs ?? [])
          .map((document) => document.id)
          .filter((id): id is string => Boolean(id))
        if (fileIds.length > 0) void attachSelectedFiles(fileIds)
      })
      .build()
    instance.setVisible(true)
  }, [attachSelectedFiles])

  const connectOrPick = useCallback(async () => {
    if (!enabled || pending) return
    setPending(true)
    try {
      if (connected) {
        await openPicker()
        return
      }
      const response = await fetch("/api/integrations/google-drive/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ returnPath: "/organization/documents" }),
      })
      const result = await readDriveResponse(response)
      if (!response.ok || !result?.authorizationUrl) {
        throw new Error(result?.code ?? "provider_unavailable")
      }
      window.location.assign(result.authorizationUrl)
    } catch (error) {
      toast.error(
        driveErrorMessage(error instanceof Error ? error.message : undefined)
      )
    } finally {
      setPending(false)
    }
  }, [connected, enabled, openPicker, pending])

  const detachDocument = useCallback(
    async (documentId: string, options: DocumentActionOptions = {}) => {
      const response = await fetch(
        `/api/integrations/google-drive/documents/${encodeURIComponent(documentId)}`,
        { method: "DELETE" }
      )
      const result = await readDriveResponse(response)
      if (!response.ok) {
        toast.error(driveErrorMessage(result?.code))
        if (options.throwOnError)
          throw new Error(driveErrorMessage(result?.code))
        return
      }
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId)
      )
      toast.success("Google Drive file removed")
    },
    []
  )

  return {
    connected,
    connectOrPick,
    detachDocument,
    documents,
    loading,
    pending,
    refresh,
  }
}
