"use client"

import {
  WORKSPACE_CANVAS_V2_CARD_CONTRACT,
  WORKSPACE_CARD_PORT_TYPES,
  type WorkspaceCanvasV2CardId,
  type WorkspaceCardPortType,
  type WorkspaceCanvasCardPorts,
} from "./workspace-card-contract"

export const WORKSPACE_PORT_TYPES = WORKSPACE_CARD_PORT_TYPES
export type WorkspacePortType = WorkspaceCardPortType

type WorkspaceCardPorts = {
  inputs: WorkspacePortType[]
  outputs: WorkspacePortType[]
}

function toMutablePorts(ports: WorkspaceCanvasCardPorts): WorkspaceCardPorts {
  return {
    inputs: [...ports.inputs],
    outputs: [...ports.outputs],
  }
}

export const WORKSPACE_CARD_PORTS = Object.freeze(
  Object.fromEntries(
    (Object.keys(WORKSPACE_CANVAS_V2_CARD_CONTRACT) as WorkspaceCanvasV2CardId[]).map(
      (cardId) => [cardId, toMutablePorts(WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId].ports)],
    ),
  ) as Record<WorkspaceCanvasV2CardId, WorkspaceCardPorts>,
)

export const WORKSPACE_PORT_COMPATIBILITY = Object.freeze({
  "workspace-link": ["workspace-link"],
  "organization-context": ["organization-context"],
  "program-plan": ["program-plan"],
  tasks: ["tasks"],
  "brand-assets": ["brand-assets"],
  "financial-model": ["financial-model"],
  schedule: ["schedule"],
  campaign: ["campaign"],
  documents: ["documents"],
} satisfies Record<WorkspacePortType, WorkspacePortType[]>)

export type WorkspaceConnectionValidationResult =
  | { allowed: true; matchedPortType: WorkspacePortType }
  | { allowed: false; reason: "same-node" | "missing-ports" | "incompatible-ports" }

export function validateWorkspaceConnection({
  source,
  target,
}: {
  source: WorkspaceCanvasV2CardId
  target: WorkspaceCanvasV2CardId
}): WorkspaceConnectionValidationResult {
  if (source === target) {
    return { allowed: false, reason: "same-node" }
  }

  const sourcePorts = WORKSPACE_CARD_PORTS[source]
  const targetPorts = WORKSPACE_CARD_PORTS[target]
  if (!sourcePorts || !targetPorts) {
    return { allowed: false, reason: "missing-ports" }
  }
  if (sourcePorts.outputs.length === 0 || targetPorts.inputs.length === 0) {
    return { allowed: false, reason: "missing-ports" }
  }

  for (const sourceOutputType of sourcePorts.outputs) {
    const allowedInputTypes =
      WORKSPACE_PORT_COMPATIBILITY[sourceOutputType] as readonly WorkspacePortType[]
    const matchedInputType = targetPorts.inputs.find((targetInputType) =>
      allowedInputTypes.some((allowedInputType) => allowedInputType === targetInputType),
    )
    if (!matchedInputType) continue
    return { allowed: true, matchedPortType: matchedInputType }
  }

  return { allowed: false, reason: "incompatible-ports" }
}

export function canConnectWorkspaceCards({
  source,
  target,
}: {
  source: WorkspaceCanvasV2CardId
  target: WorkspaceCanvasV2CardId
}) {
  return validateWorkspaceConnection({ source, target }).allowed
}
