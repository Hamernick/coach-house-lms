"use client"

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
  Action: { PICKED: string; CANCEL: string }
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

export async function pickGoogleDriveFiles(
  multiple = false
): Promise<string[]> {
  const response = await fetch("/api/integrations/google-drive/picker-token", {
    method: "POST",
  })
  const token = (await response.json()) as {
    accessToken?: string
    developerKey?: string
    appId?: string
    code?: string
  }
  if (!response.ok || !token.accessToken || !token.developerKey || !token.appId)
    throw new Error("Connect Google Drive in Workspace Tools, then try again.")
  await loadPickerScript()
  const picker = (window as PickerWindow).google?.picker
  if (!picker) throw new Error("Google Drive could not open. Try again.")
  return new Promise((resolve) => {
    const builder = new picker.PickerBuilder()
      .addView(new picker.DocsView(picker.ViewId.DOCS))
      .setAppId(token.appId!)
      .setDeveloperKey(token.developerKey!)
      .setOAuthToken(token.accessToken!)
      .setCallback((data) => {
        if (data.action === picker.Action.CANCEL) resolve([])
        if (data.action === picker.Action.PICKED)
          resolve(
            (data.docs ?? [])
              .map((document) => document.id)
              .filter((id): id is string => Boolean(id))
          )
      })
    if (multiple) builder.enableFeature(picker.Feature.MULTISELECT_ENABLED)
    builder.build().setVisible(true)
  })
}
