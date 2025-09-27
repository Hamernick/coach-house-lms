"use client"

import React, { useMemo } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Position,
  type Edge,
  type Node,
} from "reactflow"
import "reactflow/dist/style.css"
import dagre from "dagre"

type Lane = "public" | "auth" | "student" | "admin" | "stripe"
const laneColor: Record<Lane, string> = {
  public: "#e2e8f0", // slate-200
  auth: "#fde68a", // amber-300
  student: "#bbf7d0", // green-200
  admin: "#bfdbfe", // blue-200
  stripe: "#fbcfe8", // pink-200
}

function layout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 110 })
  g.setDefaultEdgeLabel(() => ({}))
  nodes.forEach((n) => g.setNode(n.id, { width: 240, height: 68 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map((n) => {
    const { x, y } = g.node(n.id)
    return { ...n, position: { x, y } }
  })
}

function laneNode(id: string, label: string, lane: Lane, x = 0, y = 0): Node {
  return {
    id,
    type: "group",
    data: { label },
    position: { x, y },
    style: {
      background: laneColor[lane],
      border: "1px solid #CBD5E1",
      borderRadius: 8,
      padding: 12,
      width: 1200,
      height: 340,
    },
  }
}

function simpleNode(id: string, label: string, laneId: string, opts?: Partial<Node>): Node {
  return {
    id,
    data: { label },
    position: { x: 0, y: 0 },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    parentId: laneId,
    extent: "parent",
    style: {
      borderRadius: 8,
      border: "1px solid #CBD5E1",
      padding: 8,
      background: "white",
    },
    ...opts,
  }
}

function simpleEdge(id: string, source: string, target: string, label?: string): Edge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: false,
    label,
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
    labelStyle: { fontSize: 11 },
  }
}

export default function UserJourneys() {
  const { nodes, edges } = useMemo(() => {
    // Lanes
    const lanes: Node[] = [
      laneNode("lane:public", "Public", "public"),
      laneNode("lane:auth", "Auth", "auth", 0, 360),
      laneNode("lane:student", "Student", "student", 0, 720),
      laneNode("lane:admin", "Admin", "admin", 0, 1080),
      laneNode("lane:stripe", "Stripe / Webhooks", "stripe", 0, 1440),
    ]

    // Public
    const publicNodes = [
      simpleNode("public:landing", "Landing (/) ", "lane:public"),
      simpleNode("public:pricing", "Pricing (/pricing)", "lane:public"),
    ]
    const publicEdges = [simpleEdge("e:p0", "public:landing", "public:pricing", "View plans")]

    // Auth
    const authNodes = [
      simpleNode("auth:login", "Login (/login)", "lane:auth"),
      simpleNode("auth:signup", "Sign up (/sign-up)", "lane:auth"),
      simpleNode("auth:forgot", "Forgot pwd (/forgot-password)", "lane:auth"),
      simpleNode("auth:update", "Update pwd (/update-password)", "lane:auth"),
      simpleNode("auth:callback", "Callback (/callback)", "lane:auth", { style: { background: "#fff7ed" } }),
    ]
    const authEdges = [
      simpleEdge("e:a0", "auth:signup", "auth:callback", "Email verify / magic link"),
      simpleEdge("e:a1", "auth:login", "student:gate", "Sign in"),
      simpleEdge("e:a2", "auth:callback", "student:gate", "Session created"),
      simpleEdge("e:a3", "auth:forgot", "auth:update", "Link → update"),
    ]

    // Student (gated)
    const studentNodes = [
      simpleNode("student:gate", "Gate: Onboarding?", "lane:student", { style: { background: "#f0fdf4" } }),
      simpleNode("student:onboarding", "Onboarding (/onboarding)", "lane:student"),
      simpleNode("student:dashboard", "Dashboard (/dashboard)", "lane:student"),
      simpleNode("student:nextup", "Next Up (card)", "lane:student"),
      simpleNode("student:classes", "Classes (/classes)", "lane:student"),
      simpleNode("student:class", "Class (/class/[slug])", "lane:student"),
      simpleNode("student:module", "Module (/class/[slug]/module/[index])", "lane:student"),
      simpleNode("student:organizations", "Organizations (/organizations)", "lane:student"),
      simpleNode("student:people", "People (/people)", "lane:student"),
      simpleNode("student:settings", "Settings (/settings)", "lane:student"),
      simpleNode("student:billing", "Billing (/billing)", "lane:student"),
    ]
    const studentEdges = [
      simpleEdge("e:s0", "student:gate", "student:onboarding", "No → complete first"),
      simpleEdge("e:s1", "student:gate", "student:dashboard", "Yes → continue"),
      simpleEdge("e:s2", "student:onboarding", "student:dashboard", "Complete"),
      simpleEdge("e:s3", "student:dashboard", "student:nextup", "See next module"),
      simpleEdge("e:s4", "student:nextup", "student:module", "Resume"),
      simpleEdge("e:s5", "student:dashboard", "student:classes", "View all"),
      simpleEdge("e:s6", "student:classes", "student:class", "Open"),
      simpleEdge("e:s7", "student:class", "student:module", "Select module"),
      simpleEdge("e:s8", "student:module", "student:module", "Complete → unlock next"),
      simpleEdge("e:s9", "student:dashboard", "student:organizations", "Preview profile"),
      simpleEdge("e:s10", "student:dashboard", "student:people", "Classmates/mentors"),
      simpleEdge("e:s11", "student:dashboard", "student:settings", "Update profile"),
      simpleEdge("e:s12", "student:dashboard", "student:billing", "Manage billing"),
    ]

    // Admin
    const adminNodes = [
      simpleNode("admin:root", "Admin (/admin)", "lane:admin"),
      simpleNode("admin:classes", "Classes (/admin/classes)", "lane:admin"),
      simpleNode("admin:class", "Class detail (/admin/classes/[id])", "lane:admin"),
      simpleNode("admin:module", "Module editor (/admin/modules/[id])", "lane:admin"),
      simpleNode("admin:users", "People (/admin/users)", "lane:admin"),
      simpleNode("admin:user", "User detail (/admin/users/[id])", "lane:admin"),
    ]
    const adminEdges = [
      simpleEdge("e:ad0", "student:dashboard", "admin:root", "Admin link (admins only)"),
      simpleEdge("e:ad1", "admin:root", "admin:classes", "Manage content"),
      simpleEdge("e:ad2", "admin:classes", "admin:class", "Edit class"),
      simpleEdge("e:ad3", "admin:class", "admin:module", "Edit module"),
      simpleEdge("e:ad4", "admin:root", "admin:users", "People"),
      simpleEdge("e:ad5", "admin:users", "admin:user", "View user"),
    ]

    // Stripe / Webhooks
    const stripeNodes = [
      simpleNode("stripe:checkout", "Stripe Checkout", "lane:stripe"),
      simpleNode("stripe:success", "Return (/pricing/success)", "lane:stripe"),
      simpleNode("stripe:webhook", "Webhook (/api/stripe/webhook)", "lane:stripe", { style: { background: "#fdf2f8" } }),
    ]
    const stripeEdges = [
      simpleEdge("e:st0", "public:pricing", "stripe:checkout", "Start checkout"),
      simpleEdge("e:st1", "stripe:checkout", "stripe:success", "Return URL"),
      simpleEdge("e:st2", "stripe:success", "student:dashboard", "See status"),
      simpleEdge("e:st3", "stripe:checkout", "stripe:webhook", "Event → subscription sync"),
      simpleEdge("e:st4", "stripe:webhook", "student:dashboard", "Status reflects"),
    ]

    // Guards and redirects
    const guardEdges = [
      simpleEdge("g:1", "student:dashboard", "auth:login", "401 → /login?redirect=…"),
      simpleEdge("g:2", "admin:root", "student:dashboard", "403 (non‑admin)"),
    ]

    const nodes = layout(
      [
        ...lanes,
        ...publicNodes,
        ...authNodes,
        ...studentNodes,
        ...adminNodes,
        ...stripeNodes,
      ],
      [...publicEdges, ...authEdges, ...studentEdges, ...adminEdges, ...stripeEdges, ...guardEdges]
    )
    const edges = [
      ...publicEdges,
      ...authEdges,
      ...studentEdges,
      ...adminEdges,
      ...stripeEdges,
      ...guardEdges,
    ]
    return { nodes, edges }
  }, [])

  return (
    <div style={{ height: "85vh", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background gap={16} color="#e5e7eb" />
        <Panel
          position="top-left"
          style={{ background: "white", padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }}
        >
          <strong>User Journeys</strong>
          <div style={{ fontSize: 12, color: "#64748b" }}>Public · Auth · Student · Admin · Stripe/Webhooks</div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

