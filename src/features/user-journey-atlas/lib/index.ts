import type {
  UserJourneyAtlasCanvas,
  UserJourneyAtlasEdge,
  UserJourneyAtlasHealthStatus,
  UserJourneyAtlasInput,
  UserJourneyAtlasLane,
  UserJourneyAtlasNode,
  UserJourneyAtlasSurfaceKind,
} from "../types"
import {
  DEFAULT_NODE_DETAILS_BY_LANE,
  USER_JOURNEY_NODE_DETAILS,
  type UserJourneyNodeDetails,
} from "./user-journey-atlas-node-details"

const LANE_WIDTH = 408
const LANE_GAP = 34
const NODE_WIDTH = 342
const NODE_HEIGHT = 388
const NODE_TOP = 72
const NODE_GAP = 132
const CANVAS_PADDING = 96

type ParsedMermaidNode = Omit<
  UserJourneyAtlasNode,
  | "categoryLabel"
  | "dataFields"
  | "fileKindLabel"
  | "healthStatus"
  | "healthStatusLabel"
  | "healthSummary"
  | "journeyStep"
  | "nextStepLabels"
  | "surfaceKind"
  | "surfaceKindLabel"
  | "systemEvents"
  | "x"
  | "y"
  | "width"
  | "height"
>

type ParsedMermaidGraph = {
  lanes: Array<Pick<UserJourneyAtlasLane, "id" | "label">>
  nodes: ParsedMermaidNode[]
  edges: UserJourneyAtlasEdge[]
}

const USER_JOURNEY_HEALTH_STATUS_LABELS: Record<
  UserJourneyAtlasHealthStatus,
  string
> = {
  "activation-gap": "Activation gap",
  "admin-reference": "Admin reference",
  "ai-stub": "AI stub",
  "integration-gap": "Integration gap",
  live: "Working path",
  "recovery-gap": "Recovery gap",
  "telemetry-gap": "Telemetry gap",
}

const USER_JOURNEY_HEALTH_STATUS_SUMMARIES: Record<
  UserJourneyAtlasHealthStatus,
  string
> = {
  "activation-gap": "This path needs an explicit value moment, completion signal, or next action.",
  "admin-reference": "Admin-only map infrastructure, not a customer-facing step.",
  "ai-stub": "The assist surface exists, but it is not wired to a model-backed AI workflow yet.",
  "integration-gap": "This path hands off internally, but the external sync or confirmation loop is incomplete.",
  live: "The core handoff exists in the current source tree.",
  "recovery-gap": "The happy path exists, but cancel, retry, expired, or delayed states need stronger handling.",
  "telemetry-gap": "The app has page or server instrumentation, but journey events are not captured yet.",
}

const USER_JOURNEY_SURFACE_KIND_LABELS: Record<
  UserJourneyAtlasSurfaceKind,
  string
> = {
  ai: "AI assist",
  access: "Access",
  admin: "Admin",
  auth: "Auth",
  coaching: "Coaching",
  data: "Data write",
  email: "Email",
  form: "Form",
  outcome: "Outcome",
  payment: "Payment",
  route: "Route",
  system: "System",
  telemetry: "Telemetry",
  workspace: "Workspace",
}

const AI_NODE_IDS = new Set(["homework_assist", "homework_assist_library"])
const COACHING_NODE_IDS = new Set(["coaching_schedule", "coaching_tier_rules"])
const OUTCOME_NODE_IDS = new Set(["workspace_activation_outcomes"])
const TELEMETRY_NODE_IDS = new Set(["product_analytics", "otel_instrumentation"])

const FORM_NODE_IDS = new Set([
  "home_signup_panel",
  "sign_up_form",
  "onboarding_card",
  "onboarding_flow",
  "onboarding_intent",
  "onboarding_pricing",
  "onboarding_org",
  "onboarding_account",
  "dynamic_form",
  "assignment_form",
  "workspace_objective_editor",
  "workspace_calendar_form",
  "workspace_comms_editor",
  "org_profile_company",
  "member_onboarding",
  "paywall_overlay",
  "invite_sheet",
])

const PAYMENT_NODE_IDS = new Set([
  "signup_plan",
  "stripe_checkout",
  "pricing_success",
  "onboarding_return",
  "stripe_webhook",
  "paywall_config",
])

const DATA_NODE_IDS = new Set([
  "module_notes_ui",
  "module_notes_api",
  "assignment_submission",
  "homework_assist",
  "public_map",
])

const AUTH_NODE_IDS = new Set([
  "sign_up_page",
  "auth_confirm",
  "auth_confirmation_rules",
  "auth_callback",
])

const ACCESS_NODE_IDS = new Set([
  "invite_actions",
  "invite_email_delivery",
  "join_org",
  "access_requests",
])

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "").trim()
}

function parseNodeLabel(label: string) {
  const parts = label
    .split(/<br\s*\/?>/i)
    .map((part) => part.trim())
    .filter(Boolean)
  const title = parts[0] ?? "Untitled"
  const route = parts
    .find((part) => part.toLowerCase().startsWith("route:"))
    ?.replace(/^route:\s*/i, "")
    .trim()
  const file = parts
    .find((part) => part.toLowerCase().startsWith("file:"))
    ?.replace(/^file:\s*/i, "")
    .trim()
  const description = parts
    .find((part) => part.toLowerCase().startsWith("desc:"))
    ?.replace(/^desc:\s*/i, "")
    .trim()

  return {
    description: description ?? "",
    file: file ?? "",
    route: route ?? "",
    title,
  }
}

function resolveUserJourneyFileKindLabel(file: string) {
  if (file.endsWith(".mmd")) return "Mermaid source"
  if (file.includes("/api/")) return "API route"
  if (file.includes("/actions/") || file.endsWith("/actions.ts")) {
    return "Server action"
  }
  if (file.includes("/app/") && file.endsWith("/route.ts")) {
    return "Route handler"
  }
  if (file.includes("/app/") && file.endsWith("/page.tsx")) {
    return "Route page"
  }
  if (file.includes("/components/")) return "Component"
  if (file.includes("/features/")) return "Feature file"
  if (file.includes("/lib/") || file.includes("/_lib/")) return "Library"

  return "Source file"
}

function resolveUserJourneySurfaceKind(
  node: ParsedMermaidNode,
): UserJourneyAtlasSurfaceKind {
  if (AI_NODE_IDS.has(node.id)) return "ai"
  if (COACHING_NODE_IDS.has(node.id)) return "coaching"
  if (OUTCOME_NODE_IDS.has(node.id)) return "outcome"
  if (TELEMETRY_NODE_IDS.has(node.id)) return "telemetry"
  if (node.laneId === "emails" || node.id.includes("email")) return "email"
  if (FORM_NODE_IDS.has(node.id)) return "form"
  if (PAYMENT_NODE_IDS.has(node.id) || node.laneId === "billing") {
    return "payment"
  }
  if (DATA_NODE_IDS.has(node.id) || node.laneId === "intake") return "data"
  if (AUTH_NODE_IDS.has(node.id) || node.laneId === "auth") return "auth"
  if (ACCESS_NODE_IDS.has(node.id) || node.laneId === "invites") {
    return "access"
  }
  if (node.laneId === "workspace") return "workspace"
  if (node.laneId === "prototype") return "admin"
  if (node.file.includes("/app/") && node.file.endsWith("/page.tsx")) {
    return "route"
  }

  return "system"
}

function resolveUserJourneyNodeDetails(
  node: ParsedMermaidNode,
): UserJourneyNodeDetails {
  return (
    USER_JOURNEY_NODE_DETAILS[node.id] ??
    DEFAULT_NODE_DETAILS_BY_LANE[node.laneId] ?? {
      dataFields: ["route state", "component props", "user context"],
      systemEvents: ["Moves the user to the next journey step"],
    }
  )
}

function resolveUserJourneyHealthStatus(
  node: ParsedMermaidNode,
  details: UserJourneyNodeDetails,
): UserJourneyAtlasHealthStatus {
  if (details.healthStatus) return details.healthStatus
  if (node.laneId === "prototype") return "admin-reference"

  return "live"
}

function buildOutgoingStepLabels(graph: ParsedMermaidGraph) {
  const titleById = new Map(graph.nodes.map((node) => [node.id, node.title]))
  const labelsByNodeId = new Map<string, string[]>()

  for (const edge of graph.edges) {
    const targetTitle = titleById.get(edge.to) ?? edge.to
    const label = `${edge.label} -> ${targetTitle}`
    const existing = labelsByNodeId.get(edge.from) ?? []
    labelsByNodeId.set(edge.from, [...existing, label])
  }

  return labelsByNodeId
}

export function parseUserJourneyAtlasMermaid(
  mermaidSource: string,
): ParsedMermaidGraph {
  const lanes: ParsedMermaidGraph["lanes"] = []
  const nodes: ParsedMermaidNode[] = []
  const edges: UserJourneyAtlasEdge[] = []
  const laneStack: string[] = []

  for (const rawLine of mermaidSource.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("%%") || line.startsWith("flowchart")) {
      continue
    }

    const subgraphMatch = line.match(/^subgraph\s+([A-Za-z0-9_-]+)\["(.+)"\]$/)
    if (subgraphMatch) {
      const [, id, label] = subgraphMatch
      lanes.push({ id, label: stripQuotes(label) })
      laneStack.push(id)
      continue
    }

    if (line === "end") {
      laneStack.pop()
      continue
    }

    const edgeMatch = line.match(
      /^([A-Za-z0-9_-]+)\s*-->\|([^|]+)\|\s*([A-Za-z0-9_-]+)$/,
    )
    if (edgeMatch) {
      const [, from, label, to] = edgeMatch
      edges.push({
        id: `${from}-${to}-${edges.length + 1}`,
        from,
        label: stripQuotes(label),
        to,
      })
      continue
    }

    const nodeMatch = line.match(/^([A-Za-z0-9_-]+)\["(.+)"\]$/)
    if (nodeMatch) {
      const [, id, label] = nodeMatch
      nodes.push({
        id,
        laneId: laneStack[laneStack.length - 1] ?? "unassigned",
        ...parseNodeLabel(label),
      })
    }
  }

  return { edges, lanes, nodes }
}

function layoutGraph(graph: ParsedMermaidGraph): {
  lanes: UserJourneyAtlasLane[]
  nodes: UserJourneyAtlasNode[]
  canvas: UserJourneyAtlasCanvas
} {
  const laneCounts = new Map<string, number>()
  const laneIndex = new Map(graph.lanes.map((lane, index) => [lane.id, index]))
  const laneLabelById = new Map(graph.lanes.map((lane) => [lane.id, lane.label]))
  const outgoingStepLabels = buildOutgoingStepLabels(graph)
  const lanes = graph.lanes.map((lane, index) => ({
    ...lane,
    width: LANE_WIDTH,
    x: CANVAS_PADDING + index * (LANE_WIDTH + LANE_GAP),
  }))

  const nodes = graph.nodes.map((node, nodeIndex) => {
    const indexInLane = laneCounts.get(node.laneId) ?? 0
    laneCounts.set(node.laneId, indexInLane + 1)
    const x =
      CANVAS_PADDING +
      (laneIndex.get(node.laneId) ?? 0) * (LANE_WIDTH + LANE_GAP) +
      Math.round((LANE_WIDTH - NODE_WIDTH) / 2)
    const y = NODE_TOP + indexInLane * (NODE_HEIGHT + NODE_GAP)
    const details = resolveUserJourneyNodeDetails(node)
    const surfaceKind = resolveUserJourneySurfaceKind(node)
    const healthStatus = resolveUserJourneyHealthStatus(node, details)

    return {
      ...node,
      categoryLabel: laneLabelById.get(node.laneId) ?? node.laneId,
      dataFields: details.dataFields,
      fileKindLabel: resolveUserJourneyFileKindLabel(node.file),
      healthStatus,
      healthStatusLabel: USER_JOURNEY_HEALTH_STATUS_LABELS[healthStatus],
      healthSummary:
        details.healthSummary ??
        USER_JOURNEY_HEALTH_STATUS_SUMMARIES[healthStatus],
      journeyStep: nodeIndex + 1,
      nextStepLabels: outgoingStepLabels.get(node.id) ?? [],
      surfaceKind,
      surfaceKindLabel: USER_JOURNEY_SURFACE_KIND_LABELS[surfaceKind],
      systemEvents: details.systemEvents,
      height: NODE_HEIGHT,
      width: NODE_WIDTH,
      x,
      y,
    }
  })

  const canvas = {
    height:
      Math.max(
        560,
        ...nodes.map((node) => node.y + node.height + CANVAS_PADDING),
      ) + CANVAS_PADDING,
    width:
      CANVAS_PADDING * 2 +
      graph.lanes.length * LANE_WIDTH +
      Math.max(0, graph.lanes.length - 1) * LANE_GAP,
  }

  return { canvas, lanes, nodes }
}

export function buildUserJourneyAtlasInput({
  mermaidPath,
  mermaidSource,
}: {
  mermaidPath: string
  mermaidSource: string
}): UserJourneyAtlasInput {
  const parsed = parseUserJourneyAtlasMermaid(mermaidSource)
  const layout = layoutGraph(parsed)

  return normalizeUserJourneyAtlasInput({
    id: "user-journey-atlas",
    title: "User journey atlas",
    subtitle:
      "Mermaid-backed map of the actual route, component, API, email, data-intake, telemetry, coaching, AI-assist, and activation files that carry users through signup, billing, onboarding, workspace, find, upgrades, invites, notes, and homework.",
    updatedLabel: "Generated from Mermaid source",
    mermaidPath,
    mermaidSource,
    metrics: [
      {
        label: "Files",
        value: String(parsed.nodes.length),
        detail: "Actual app, component, API, action, and feature files represented as canvas nodes.",
      },
      {
        label: "Edges",
        value: String(parsed.edges.length),
        detail: "Journey handoffs parsed from the Mermaid graph.",
      },
      {
        label: "Lanes",
        value: String(parsed.lanes.length),
        detail: "Public, auth, email, billing, onboarding, workspace, intake, find, upgrade, invite, journey operations, and prototype surfaces.",
      },
    ],
    ...layout,
    edges: parsed.edges,
  })
}

export function normalizeUserJourneyAtlasInput(
  input: UserJourneyAtlasInput,
): UserJourneyAtlasInput {
  return {
    ...input,
    edges: input.edges.filter((edge) => edge.from && edge.to),
    nodes: input.nodes.filter((node) => node.file && node.title),
  }
}
