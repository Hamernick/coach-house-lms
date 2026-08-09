import type { WorkspaceBoardForwardCompatibilityState } from "./workspace-board-types"
import { normalizeWorkspaceCardId } from "./workspace-board-card-id"

type WorkspaceBoardForwardCompatibleInput = {
  connections: unknown
  forwardCompatibility: unknown
  hiddenCardIds: unknown
  nodes: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeId(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readForwardCompatibility(value: unknown) {
  if (!isRecord(value)) {
    return {
      connections: [],
      hiddenCardIds: [],
      nodes: [],
    }
  }

  return {
    connections: readArray(value.connections),
    hiddenCardIds: readArray(value.hiddenCardIds),
    nodes: readArray(value.nodes),
  }
}

function collectForwardCompatibleNodes(values: unknown[]) {
  const nodes = new Map<string, Record<string, unknown>>()

  for (const value of values) {
    if (!isRecord(value)) continue
    const id = normalizeId(value.id)
    if (!id || normalizeWorkspaceCardId(id) || nodes.has(id)) continue
    nodes.set(id, { ...value, id })
  }

  return Array.from(nodes.values())
}

function collectForwardCompatibleConnections(values: unknown[]) {
  const connections = new Map<string, Record<string, unknown>>()

  for (const value of values) {
    if (!isRecord(value)) continue
    const source = normalizeId(value.source)
    const target = normalizeId(value.target)
    if (!source || !target || source === target) continue
    if (normalizeWorkspaceCardId(source) && normalizeWorkspaceCardId(target)) {
      continue
    }

    const key = `${source}->${target}`
    if (connections.has(key)) continue
    connections.set(key, { ...value, source, target })
  }

  return Array.from(connections.values())
}

function collectForwardCompatibleHiddenCardIds(values: unknown[]) {
  const hiddenCardIds = new Set<string>()

  for (const value of values) {
    const id = normalizeId(value)
    if (!id || normalizeWorkspaceCardId(id)) continue
    hiddenCardIds.add(id)
  }

  return Array.from(hiddenCardIds)
}

export function resolveWorkspaceBoardForwardCompatibleInput({
  connections,
  forwardCompatibility,
  hiddenCardIds,
  nodes,
}: WorkspaceBoardForwardCompatibleInput) {
  const forwarded = readForwardCompatibility(forwardCompatibility)
  const combinedNodes = [...readArray(nodes), ...forwarded.nodes]
  const combinedConnections = [
    ...readArray(connections),
    ...forwarded.connections,
  ]
  const combinedHiddenCardIds = [
    ...readArray(hiddenCardIds),
    ...forwarded.hiddenCardIds,
  ]
  const nextForwardCompatibility: WorkspaceBoardForwardCompatibilityState = {
    nodes: collectForwardCompatibleNodes(combinedNodes),
    connections: collectForwardCompatibleConnections(combinedConnections),
    hiddenCardIds: collectForwardCompatibleHiddenCardIds(combinedHiddenCardIds),
  }
  const hasForwardCompatibleState =
    nextForwardCompatibility.nodes.length > 0 ||
    nextForwardCompatibility.connections.length > 0 ||
    nextForwardCompatibility.hiddenCardIds.length > 0

  return {
    connections: combinedConnections,
    forwardCompatibility: hasForwardCompatibleState
      ? nextForwardCompatibility
      : undefined,
    hiddenCardIds: combinedHiddenCardIds,
    nodes: combinedNodes,
  }
}

export function mergeWorkspaceBoardForwardCompatibilityState(
  primary: WorkspaceBoardForwardCompatibilityState | undefined,
  secondary: WorkspaceBoardForwardCompatibilityState | undefined
) {
  return resolveWorkspaceBoardForwardCompatibleInput({
    connections: primary?.connections,
    forwardCompatibility: secondary,
    hiddenCardIds: primary?.hiddenCardIds,
    nodes: primary?.nodes,
  }).forwardCompatibility
}
