"use client"

export type ReactGrabDebugSurfaceKind =
  | "trigger"
  | "content"
  | "indicator"
  | "portal"
  | "root"

export type ReactGrabDebugSurfaceRecord = {
  ownerId: string
  component: string
  source: string
  slot?: string
  surfaceKind?: ReactGrabDebugSurfaceKind
  className: string
  classAssemblyFile: string
  primitiveImport?: string | null
  tokenSource?: string | null
  canonicalOwnerFile?: string | null
  canonicalOwnerReason?: string | null
  currentWrongOwnerFile?: string | null
  currentWrongOwnerReason?: string | null
  notes?: string | null
}

export type ReactGrabDebugSurfaceAttributes = {
  "data-react-grab-owner-id"?: string
  "data-react-grab-link-id"?: string
  "data-react-grab-owner-component"?: string
  "data-react-grab-surface-component"?: string
  "data-react-grab-owner-source"?: string
  "data-react-grab-surface-source"?: string
  "data-react-grab-owner-slot"?: string
  "data-react-grab-surface-slot"?: string
  "data-react-grab-surface-kind"?: string
  "data-react-grab-canonical-owner-source"?: string
  "data-react-grab-canonical-owner-reason"?: string
  "data-react-grab-current-wrong-owner-source"?: string
  "data-react-grab-current-wrong-owner-reason"?: string
  "data-react-grab-token-source"?: string
  "data-react-grab-primitive-import"?: string
  "data-react-grab-notes"?: string
}

type ReactGrabDebugSurfaceRegistry = Record<string, ReactGrabDebugSurfaceRecord[]>

declare global {
  interface Window {
    __REACT_GRAB_SURFACES__?: ReactGrabDebugSurfaceRegistry
  }
}

function normalizeOptionalString(value: string | null | undefined) {
  return value && value.length > 0 ? value : undefined
}

export function resolveReactGrabDebugOwnerId(
  attributes: ReactGrabDebugSurfaceAttributes,
) {
  return normalizeOptionalString(
    attributes["data-react-grab-owner-id"] ??
      attributes["data-react-grab-link-id"] ??
      null,
  )
}

function resolveReactGrabDebugSurfaceKind(
  value: string | null | undefined,
  fallback: ReactGrabDebugSurfaceKind,
): ReactGrabDebugSurfaceKind {
  switch (value) {
    case "trigger":
    case "content":
    case "indicator":
    case "portal":
    case "root":
      return value
    default:
      return fallback
  }
}

export function buildReactGrabDebugSurfaceRecord({
  attributes,
  fallbackComponent,
  fallbackSource,
  defaultSlot,
  defaultSurfaceKind,
  className,
  classAssemblyFile,
  primitiveImport = null,
}: {
  attributes: ReactGrabDebugSurfaceAttributes
  fallbackComponent: string
  fallbackSource: string
  defaultSlot?: string
  defaultSurfaceKind: ReactGrabDebugSurfaceKind
  className: string
  classAssemblyFile: string
  primitiveImport?: string | null
}): ReactGrabDebugSurfaceRecord | null {
  const ownerId = resolveReactGrabDebugOwnerId(attributes)
  if (!ownerId) return null

  return {
    ownerId,
    component:
      normalizeOptionalString(
        attributes["data-react-grab-surface-component"] ??
          attributes["data-react-grab-owner-component"],
      ) ?? fallbackComponent,
    source:
      normalizeOptionalString(
        attributes["data-react-grab-surface-source"] ??
          attributes["data-react-grab-owner-source"],
      ) ?? fallbackSource,
    slot:
      normalizeOptionalString(
        attributes["data-react-grab-surface-slot"] ??
          attributes["data-react-grab-owner-slot"],
      ) ?? defaultSlot,
    surfaceKind: resolveReactGrabDebugSurfaceKind(
      attributes["data-react-grab-surface-kind"],
      defaultSurfaceKind,
    ),
    className,
    classAssemblyFile,
    primitiveImport:
      normalizeOptionalString(attributes["data-react-grab-primitive-import"]) ??
      primitiveImport,
    tokenSource: normalizeOptionalString(attributes["data-react-grab-token-source"]),
    canonicalOwnerFile: normalizeOptionalString(
      attributes["data-react-grab-canonical-owner-source"],
    ),
    canonicalOwnerReason: normalizeOptionalString(
      attributes["data-react-grab-canonical-owner-reason"],
    ),
    currentWrongOwnerFile: normalizeOptionalString(
      attributes["data-react-grab-current-wrong-owner-source"],
    ),
    currentWrongOwnerReason: normalizeOptionalString(
      attributes["data-react-grab-current-wrong-owner-reason"],
    ),
    notes: normalizeOptionalString(attributes["data-react-grab-notes"]),
  }
}

function getReactGrabDebugSurfaceIdentity(record: ReactGrabDebugSurfaceRecord) {
  return [
    record.component,
    record.slot ?? "root",
    record.surfaceKind ?? "root",
    record.source,
  ].join("::")
}

export function debugSurfaceClass(record: ReactGrabDebugSurfaceRecord) {
  if (typeof window !== "undefined") {
    const registry = (window.__REACT_GRAB_SURFACES__ ??= {})
    const currentEntries = registry[record.ownerId] ?? []
    const nextIdentity = getReactGrabDebugSurfaceIdentity(record)
    registry[record.ownerId] = [
      ...currentEntries.filter(
        (entry) => getReactGrabDebugSurfaceIdentity(entry) !== nextIdentity,
      ),
      record,
    ]
  }

  return record.className
}

export function getReactGrabDebugSurfaceRecord({
  ownerId,
  component,
  slot,
  surfaceKind,
  source,
  strict = false,
}: {
  ownerId: string
  component?: string | null
  slot?: string | null
  surfaceKind?: string | null
  source?: string | null
  strict?: boolean
}) {
  if (typeof window === "undefined") return null

  const entries = window.__REACT_GRAB_SURFACES__?.[ownerId] ?? []
  if (entries.length === 0) return null

  const matches = entries.filter((entry) => {
    if (component && entry.component !== component) return false
    if (slot && entry.slot !== slot) return false
    if (surfaceKind && entry.surfaceKind !== surfaceKind) return false
    if (source && entry.source !== source) return false
    return true
  })

  if (matches.length > 0) {
    return matches[0] ?? null
  }

  if (strict) {
    return null
  }

  const rankedCandidates = [
    entries.find(
      (entry) =>
        Boolean(slot) &&
        Boolean(surfaceKind) &&
        entry.slot === slot &&
        entry.surfaceKind === surfaceKind,
    ),
    entries.find(
      (entry) => Boolean(component) && entry.component === component,
    ),
    entries[0],
  ]

  return rankedCandidates.find(Boolean) ?? null
}
