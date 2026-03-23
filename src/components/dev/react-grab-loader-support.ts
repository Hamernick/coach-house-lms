"use client"

import { buildReactGrabClipboardReport } from "@/components/dev/react-grab-clipboard-report"
import { getReactGrabDebugSurfaceRecord } from "@/components/dev/react-grab-debug-surface"

const REACT_GRAB_SOURCE_KEYS = [
  "file",
  "filePath",
  "path",
  "source",
  "sourceFile",
  "componentPath",
] as const
const REACT_GRAB_LINE_KEYS = ["line", "lineNumber"] as const
const REACT_GRAB_COLUMN_KEYS = ["column", "columnNumber"] as const
const REACT_GRAB_IMPORT_KEYS = [
  "import",
  "importPath",
  "importSource",
  "modulePath",
  "moduleName",
] as const
const REACT_GRAB_COMPONENT_KEYS = [
  "component",
  "componentName",
  "displayName",
  "name",
  "functionName",
] as const

export type ReactGrabPlugin = {
  name: string
  hooks?: {
    onElementSelect?: (element: Element) => boolean | void | Promise<boolean>
    transformCopyContent?: (
      content: string,
      elements: Element[],
    ) => string | Promise<string>
  }
}

type ReactGrabSourceInfo = {
  file?: string | null
  line?: number | null
  column?: number | null
  importSource?: string | null
  componentName?: string | null
}

type ReactGrabStackFrame = {
  component?: string | null
  displayName?: string | null
  name?: string | null
  source?: string | null
}

export type ReactGrabApi = {
  copyElement: (elements: Element | Element[]) => Promise<boolean>
  registerPlugin: (plugin: ReactGrabPlugin) => void
  unregisterPlugin: (name: string) => void
  getSource?: (element: Element) => Promise<unknown> | unknown
  getStackContext?: (element: Element) => Promise<unknown> | unknown
  getDisplayName?: (element: Element) => string | null | undefined
}

export type ReactGrabResolutionTrace = {
  selectedTag: string
  selectedClasses: string
  resolvedOwnerId: string | null
  resolvedOwnerComponent: string | null
  resolvedOwnerSource: string | null
  resolutionMode: "direct-anchor" | "linked-surface" | "legacy-fallback" | "none"
}

type ReactGrabElementMetadata = {
  ownerId: string | null
  component: string | null
  source: string | null
  slot: string | null
  surfaceKind: string | null
  canonicalOwnerSource: string | null
  canonicalOwnerReason: string | null
  currentWrongOwnerSource: string | null
  currentWrongOwnerReason: string | null
  tokenSource: string | null
  primitiveImport: string | null
  notes: string | null
  className: string
}

type ReactGrabSelectionContext = {
  selectedElement: Element
  selectedSurfaceElement: Element
  targetElement: Element | null
  trace: ReactGrabResolutionTrace
}

let latestReactGrabSelectionContext: ReactGrabSelectionContext | null = null

function getStringField(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

function getNumberField(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
  }

  return null
}

function normalizeOptionalString(value: string | null | undefined) {
  return value && value.length > 0 ? value : null
}

function normalizeReactGrabStackLabel(value: string) {
  const componentMatch = value.match(/\bin\s+([A-Za-z0-9$_.-]+)/)
  if (componentMatch?.[1]) {
    return componentMatch[1]
  }

  return value.trim()
}

function readElementAttribute(element: Element | null, name: string) {
  return typeof element?.getAttribute === "function"
    ? element.getAttribute(name)
    : null
}

function querySurfaceElement(element: Element | null, selector: string) {
  return typeof element?.querySelector === "function"
    ? element.querySelector(selector)
    : null
}

function toImportPath(filePath: string | null) {
  if (!filePath?.startsWith("src/")) return null

  return `@/${filePath.slice(4).replace(/\.[^.]+$/, "")}`
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function inferReactGrabSurfaceKind(slot: string | null, fallback = "root") {
  if (!slot) return fallback
  if (slot.includes("content")) return "content"
  if (slot.includes("trigger") || slot === "button") return "trigger"
  if (slot.includes("indicator")) return "indicator"
  return fallback
}

function readReactGrabElementMetadata(
  element: Element | null,
): ReactGrabElementMetadata {
  if (!element) {
    return {
      ownerId: null,
      component: null,
      source: null,
      slot: null,
      surfaceKind: null,
      canonicalOwnerSource: null,
      canonicalOwnerReason: null,
      currentWrongOwnerSource: null,
      currentWrongOwnerReason: null,
      tokenSource: null,
      primitiveImport: null,
      notes: null,
      className: "",
    }
  }

  const slot =
    normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-surface-slot") ??
        readElementAttribute(element, "data-react-grab-owner-slot"),
    ) ?? normalizeOptionalString(readElementAttribute(element, "data-slot"))

  return {
    ownerId: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-owner-id") ??
        readElementAttribute(element, "data-react-grab-link-id"),
    ),
    component: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-surface-component") ??
        readElementAttribute(element, "data-react-grab-owner-component") ??
        readElementAttribute(element, "data-slot"),
    ),
    source: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-surface-source") ??
        readElementAttribute(element, "data-react-grab-owner-source"),
    ),
    slot,
    surfaceKind:
      normalizeOptionalString(
        readElementAttribute(element, "data-react-grab-surface-kind"),
      ) ??
      inferReactGrabSurfaceKind(slot, "root"),
    canonicalOwnerSource: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-canonical-owner-source"),
    ),
    canonicalOwnerReason: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-canonical-owner-reason"),
    ),
    currentWrongOwnerSource: normalizeOptionalString(
      readElementAttribute(
        element,
        "data-react-grab-current-wrong-owner-source",
      ),
    ),
    currentWrongOwnerReason: normalizeOptionalString(
      readElementAttribute(
        element,
        "data-react-grab-current-wrong-owner-reason",
      ),
    ),
    tokenSource: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-token-source"),
    ),
    primitiveImport: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-primitive-import"),
    ),
    notes: normalizeOptionalString(
      readElementAttribute(element, "data-react-grab-notes"),
    ),
    className: readElementAttribute(element, "class") ?? "",
  }
}

function hasExplicitReactGrabMetadata(element: Element | null) {
  if (!element) return false

  return Boolean(
    readElementAttribute(element, "data-react-grab-owner-id") ??
      readElementAttribute(element, "data-react-grab-link-id") ??
      readElementAttribute(element, "data-react-grab-owner-component") ??
      readElementAttribute(element, "data-react-grab-surface-component") ??
      readElementAttribute(element, "data-react-grab-owner-source") ??
      readElementAttribute(element, "data-react-grab-surface-source") ??
      readElementAttribute(element, "data-react-grab-owner-slot") ??
      readElementAttribute(element, "data-react-grab-surface-slot") ??
      readElementAttribute(element, "data-react-grab-surface-kind"),
  )
}

async function resolveReactGrabSourceInfo(
  api: ReactGrabApi,
  element: Element | null,
): Promise<ReactGrabSourceInfo | null> {
  if (!element || !api.getSource) return null

  const raw = await Promise.resolve(api.getSource(element))

  if (typeof raw === "string") {
    return { file: raw }
  }

  if (!raw || typeof raw !== "object") {
    return null
  }

  const record = raw as Record<string, unknown>
  return {
    file: getStringField(record, REACT_GRAB_SOURCE_KEYS),
    line: getNumberField(record, REACT_GRAB_LINE_KEYS),
    column: getNumberField(record, REACT_GRAB_COLUMN_KEYS),
    importSource: getStringField(record, REACT_GRAB_IMPORT_KEYS),
    componentName: getStringField(record, REACT_GRAB_COMPONENT_KEYS),
  }
}

function formatReactGrabFileLocation(sourceInfo: ReactGrabSourceInfo | null) {
  if (!sourceInfo?.file) return "unknown"
  if (sourceInfo.line && sourceInfo.column) {
    return `${sourceInfo.file}:${sourceInfo.line}:${sourceInfo.column}`
  }
  if (sourceInfo.line) {
    return `${sourceInfo.file}:${sourceInfo.line}`
  }
  return sourceInfo.file
}

function resolveReactGrabSurfaceLocation({
  selectedSurfaceSource,
  selectedSourceInfo,
}: {
  selectedSurfaceSource: string | null
  selectedSourceInfo: ReactGrabSourceInfo | null
}) {
  if (!selectedSurfaceSource) {
    return formatReactGrabFileLocation(selectedSourceInfo)
  }

  if (selectedSourceInfo?.file === selectedSurfaceSource) {
    return formatReactGrabFileLocation(selectedSourceInfo)
  }

  return selectedSurfaceSource
}

async function resolveReactGrabStackChain(
  api: ReactGrabApi,
  element: Element | null,
): Promise<string[]> {
  if (!element || !api.getStackContext) return []

  const raw = await Promise.resolve(api.getStackContext(element))
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (typeof entry === "string") {
          return normalizeReactGrabStackLabel(entry)
        }
        if (!entry || typeof entry !== "object") return null
        const frame = entry as ReactGrabStackFrame
        return frame.component ?? frame.displayName ?? frame.name ?? frame.source ?? null
      })
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 5)
  }

  if (typeof raw === "string") {
    return [normalizeReactGrabStackLabel(raw)]
  }

  return []
}

function resolveReactGrabSelectedSurfaceElement(element: Element) {
  const ownerOrLinkSelector =
    "[data-react-grab-owner-id], [data-react-grab-link-id]"
  const surfaceSelector = `${ownerOrLinkSelector}, [data-slot]`

  return (
    (typeof element.closest === "function"
      ? element.closest(surfaceSelector)
      : null) ??
    querySurfaceElement(element, ownerOrLinkSelector) ??
    querySurfaceElement(element, "[data-slot]") ??
    element
  )
}

function buildReactGrabResolutionTrace(
  element: Element,
  target: Element | null,
  resolutionMode: ReactGrabResolutionTrace["resolutionMode"],
): ReactGrabResolutionTrace {
  return {
    selectedTag:
      typeof element.tagName === "string" ? element.tagName.toLowerCase() : "unknown",
    selectedClasses: readElementAttribute(element, "class") ?? "",
    resolvedOwnerId:
      readElementAttribute(target, "data-react-grab-owner-id") ?? null,
    resolvedOwnerComponent:
      readElementAttribute(target, "data-react-grab-owner-component") ?? null,
    resolvedOwnerSource:
      readElementAttribute(target, "data-react-grab-owner-source") ?? null,
    resolutionMode,
  }
}

export function resolveReactGrabSemanticTarget(element: Element): Element | null {
  const directAnchor = element.closest("[data-react-grab-anchor]")
  if (directAnchor) return directAnchor

  const linkedSurface =
    (typeof element.closest === "function"
      ? element.closest("[data-react-grab-link-id], [data-react-grab-owner-id]")
      : null) ??
    querySurfaceElement(element, "[data-react-grab-link-id], [data-react-grab-owner-id]")
  const ownerId =
    readElementAttribute(linkedSurface, "data-react-grab-owner-id") ??
    readElementAttribute(linkedSurface, "data-react-grab-link-id")
  if (!ownerId) return null

  return document.querySelector(
    `[data-react-grab-anchor][data-react-grab-owner-id="${ownerId}"]`,
  )
}

function sanitizeReactGrabCopyContent(content: string) {
  return content.replace(/\sdata-react-grab-[a-z-]+="[^"]*"/g, "")
}

async function buildReactGrabClipboardOutput({
  api,
  content,
  elements,
  selectionContext,
}: {
  api: ReactGrabApi
  content: string
  elements: Element[]
  selectionContext: ReactGrabSelectionContext | null
}) {
  const selectedSurfaceElement =
    selectionContext?.selectedSurfaceElement ??
    elements[0] ??
    selectionContext?.selectedElement ??
    null
  const targetElement =
    selectionContext?.targetElement ??
    (selectedSurfaceElement
      ? resolveReactGrabSemanticTarget(selectedSurfaceElement)
      : null) ??
    elements[0] ??
    null

  if (!selectedSurfaceElement && !targetElement) {
    return sanitizeReactGrabCopyContent(content)
  }

  const selectedSurfaceMetadata =
    readReactGrabElementMetadata(selectedSurfaceElement)
  const ownerMetadata = readReactGrabElementMetadata(targetElement)
  const ownerId = selectedSurfaceMetadata.ownerId ?? ownerMetadata.ownerId ?? null
  const selectedSurfaceHasExplicitMetadata =
    hasExplicitReactGrabMetadata(selectedSurfaceElement)
  const debugRecord = ownerId
    && selectedSurfaceHasExplicitMetadata
    ? getReactGrabDebugSurfaceRecord({
        ownerId,
        component:
          selectedSurfaceMetadata.component ?? ownerMetadata.component ?? null,
        slot: selectedSurfaceMetadata.slot ?? ownerMetadata.slot ?? null,
        surfaceKind:
          selectedSurfaceMetadata.surfaceKind ?? ownerMetadata.surfaceKind ?? null,
        source: selectedSurfaceMetadata.source ?? null,
        strict: true,
      })
    : null
  const selectedSourceInfo = await resolveReactGrabSourceInfo(
    api,
    selectedSurfaceElement,
  )
  const ownerSourceInfo = await resolveReactGrabSourceInfo(api, targetElement)
  const stackChain = await resolveReactGrabStackChain(api, selectedSurfaceElement)
  const displayName =
    api.getDisplayName?.(selectedSurfaceElement ?? targetElement ?? elements[0]!) ??
    null
  const surfaceComponent =
    selectedSurfaceMetadata.component ??
    displayName ??
    selectedSourceInfo?.componentName ??
    ownerMetadata.component ??
    "Unknown"
  const surfaceSource =
    selectedSurfaceMetadata.source ?? selectedSourceInfo?.file ?? null
  const primitiveImport =
    debugRecord?.primitiveImport ??
    selectedSurfaceMetadata.primitiveImport ??
    selectedSourceInfo?.importSource ??
    toImportPath(surfaceSource)
  const classAssemblyFile = debugRecord?.classAssemblyFile ?? surfaceSource
  const tokenSource =
    debugRecord?.tokenSource ??
    selectedSurfaceMetadata.tokenSource ??
    null
  const finalClassName =
    debugRecord?.className ??
    selectedSurfaceMetadata.className ??
    ""
  const chainValues = uniqueStrings([
    ...stackChain,
    ownerMetadata.component,
    surfaceComponent,
  ])
  return buildReactGrabClipboardReport({
    surfaceComponent,
    slot: selectedSurfaceMetadata.slot ?? ownerMetadata.slot ?? "unknown",
    surfaceKind:
      selectedSurfaceMetadata.surfaceKind ??
      ownerMetadata.surfaceKind ??
      "unknown",
    importSource: primitiveImport,
    sourceLocation: resolveReactGrabSurfaceLocation({
      selectedSurfaceSource: surfaceSource,
      selectedSourceInfo,
    }),
    ownerId,
    ownerComponent: ownerMetadata.component,
    ownerSource: ownerMetadata.source ?? ownerSourceInfo?.file ?? null,
    classAssemblyFile,
    tokenSource,
    canonicalOwnerSource:
      debugRecord?.canonicalOwnerFile ??
      selectedSurfaceMetadata.canonicalOwnerSource,
    canonicalOwnerReason:
      debugRecord?.canonicalOwnerReason ??
      selectedSurfaceMetadata.canonicalOwnerReason,
    currentWrongOwnerSource:
      debugRecord?.currentWrongOwnerFile ??
      selectedSurfaceMetadata.currentWrongOwnerSource,
    currentWrongOwnerReason:
      debugRecord?.currentWrongOwnerReason ??
      selectedSurfaceMetadata.currentWrongOwnerReason,
    finalClassName,
    chainValues,
    notes:
      debugRecord?.notes ??
      selectedSurfaceMetadata.notes ??
      null,
  })
}

export function createReactGrabClipboardTransformer({
  api,
  getSelectionContext = () => latestReactGrabSelectionContext,
}: {
  api: ReactGrabApi
  getSelectionContext?: () => ReactGrabSelectionContext | null
}) {
  return async (content: string, elements: Element[]) => {
    const selectionContext = getSelectionContext()

    try {
      return await buildReactGrabClipboardOutput({
        api,
        content,
        elements,
        selectionContext,
      })
    } finally {
      latestReactGrabSelectionContext = null
    }
  }
}

export function createReactGrabSemanticSelectionHandler({
  copyElement,
  resolveTarget = resolveReactGrabSemanticTarget,
  onResolved,
}: {
  copyElement: ReactGrabApi["copyElement"]
  resolveTarget?: (element: Element) => Element | null
  onResolved?: (trace: ReactGrabResolutionTrace) => void
}) {
  return (element: Element) => {
    const target = resolveTarget(element)
    const resolutionMode =
      target === element
        ? "direct-anchor"
        : target
          ? "linked-surface"
          : element.closest("[data-react-grab-link-id]")
            ? "legacy-fallback"
            : "none"
    const trace = buildReactGrabResolutionTrace(element, target, resolutionMode)
    latestReactGrabSelectionContext = {
      selectedElement: element,
      selectedSurfaceElement: resolveReactGrabSelectedSurfaceElement(element),
      targetElement: target,
      trace,
    }
    onResolved?.(trace)
    if (!target || target === element) return
    return copyElement(target)
  }
}
