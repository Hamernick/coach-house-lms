"use client"

import type {
  ReactGrabApi,
  ReactGrabSourceInfo,
  ReactGrabStackFrame,
} from "./react-grab-loader-types"

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

function normalizeReactGrabStackLabel(value: string) {
  const componentMatch = value.match(/\bin\s+([A-Za-z0-9$_.-]+)/)
  if (componentMatch?.[1]) {
    return componentMatch[1]
  }

  return value.trim()
}

export async function resolveReactGrabSourceInfo(
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

export function resolveReactGrabSurfaceLocation({
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

export async function resolveReactGrabStackChain(
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
        return (
          frame.component ?? frame.displayName ?? frame.name ?? frame.source ?? null
        )
      })
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 5)
  }

  if (typeof raw === "string") {
    return [normalizeReactGrabStackLabel(raw)]
  }

  return []
}
