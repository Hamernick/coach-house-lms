"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import ReactFlow, { Background, Controls } from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { RoadmapEditorToc } from "@/components/roadmap/roadmap-editor/components/roadmap-editor-toc"
import type { RoadmapSection } from "@/lib/roadmap/types"
import {
  emptyWorkspaceParticleState,
  normalizeWorkspaceParticleState,
} from "../lib"
import type { WorkspaceParticleState } from "../types"
import { useWorkspaceParticlesController } from "../hooks/use-workspace-particles-controller"
import { WorkspaceParticleNode } from "./particle-node"
import { WorkspaceParticlesProvider } from "./particle-context"
import { WorkspaceParticlesPanel } from "./workspace-particles-panel"

const NODE_TYPES = { "workspace-particle": WorkspaceParticleNode }
const STORAGE_KEY = "visual-fixture-particles-v1"
const PICK_FILES = async () => {
  toast.info("Choose Drive files from your real workspace.")
  return []
}
const LOAD_DOCUMENTS = async () => [
  {
    id: "doc-attachment",
    fileId: "google-file-123",
    name: "Training plan",
    mimeType: "application/vnd.google-apps.document",
    status: "available" as const,
  },
]
const PREVIEW_UPLOAD = async () => {
  toast.info("Upload images from your real workspace.")
}
const SECTIONS: RoadmapSection[] = [
  [
    "mission",
    "Mission",
    "Our purpose",
    "Help neighbors build healthier homes through practical training and meaningful work.",
  ],
  [
    "vision",
    "Vision",
    "The future we imagine",
    "A neighborhood where every home is safe, and every resident can thrive.",
  ],
  [
    "values",
    "Values",
    "What guides us",
    "## People first\nWe work alongside our neighbors.\n\n## Shared knowledge\nSkills grow when we share them.",
  ],
].map(([id, title, subtitle, content]) => ({
  id,
  title,
  subtitle,
  content,
  slug: id,
  lastUpdated: null,
  isPublic: false,
  layout: "wide",
  status: "in_progress",
  templateTitle: title,
  templateSubtitle: subtitle,
  titleIsTemplate: false,
  subtitleIsTemplate: false,
}))

// Development-only sample data. Production uses the organization's saved board.
export function WorkspaceParticlesVisualFixture() {
  const [state, setState] = useState<WorkspaceParticleState>(
    emptyWorkspaceParticleState
  )
  const [ready, setReady] = useState(false)
  const [canEdit, setCanEdit] = useState(true)
  const sections = SECTIONS
  const [collapsed, setCollapsed] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const dark = ready && resolvedTheme === "dark"
  const tocRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    try {
      setState(
        normalizeWorkspaceParticleState(
          JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
        )
      )
    } catch {
      /* A fixture reset starts empty. */
    }
    setReady(true)
  }, [])
  const save = useCallback((next: WorkspaceParticleState) => {
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])
  const controller = useWorkspaceParticlesController({
    state,
    sections,
    canEdit,
    enabled: ready,
    onChange: save,
    pickDriveFiles: PICK_FILES,
    loadDriveDocuments: LOAD_DOCUMENTS,
  })
  useEffect(() => {
    if (controller.draggingSource) setCollapsed(true)
  }, [controller.draggingSource])
  return (
    <WorkspaceParticlesProvider
      controller={{ ...controller, uploadImage: PREVIEW_UPLOAD }}
    >
      <main>
        <div className="bg-background text-foreground flex h-dvh flex-col">
          <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <div className="mr-auto">
              <h1 className="text-sm font-semibold">Particles preview</h1>
              <p className="text-muted-foreground text-xs">
                Sample content · saved only in this browser
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTheme(dark ? "light" : "dark")}
            >
              {dark ? "Light" : "Dark"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCanEdit(!canEdit)}
            >
              {canEdit ? "View only" : "Enable editing"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                controller.updateRoadmapSection({
                  ...SECTIONS[0],
                  lastUpdated: new Date().toISOString(),
                  content: "Updated mission from the original section.",
                })
              }
            >
              Update linked section
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => save(emptyWorkspaceParticleState())}
            >
              Reset preview
            </Button>
          </header>
          <div
            ref={controller.setCanvas}
            data-workspace-canvas-flow-frame
            className="relative min-h-0 flex-1"
          >
            <ReactFlow
              nodes={controller.nodes}
              edges={state.connections.map((edge) => ({
                ...edge,
                sourceHandle: "particle-out",
                targetHandle: "particle-in",
                type: "smoothstep",
              }))}
              nodeTypes={NODE_TYPES}
              onInit={controller.setFlow}
              onNodesChange={controller.onNodesChange}
              onNodeDragStart={() => controller.setDraggingNode(true)}
              onNodeDragStop={(event, node, nodes) =>
                controller.persistPositions(nodes.length ? nodes : [node], {
                  x: event.clientX,
                  y: event.clientY,
                })
              }
              onConnect={controller.connect}
              onEdgeDoubleClick={(_, edge) => controller.disconnect(edge.id)}
              minZoom={0.25}
              maxZoom={1.5}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              nodesDraggable={canEdit}
              nodesConnectable={canEdit}
              deleteKeyCode={canEdit ? ["Backspace", "Delete"] : null}
            >
              <Background gap={22} size={1} />
              <Controls position="top-right" />
            </ReactFlow>
            <aside className="bg-card absolute top-4 left-4 hidden w-52 rounded-xl border p-3 shadow-sm lg:block">
              <h2 className="mb-3 text-xs font-medium">Roadmap sections</h2>
              <RoadmapEditorToc
                tocItems={sections.map((section) => ({
                  type: "item",
                  section,
                  depth: 0,
                }))}
                activeSectionId="mission"
                drafts={{}}
                openGroups={{}}
                tocIndicator={{ top: 0, height: 0, visible: false }}
                sectionsListRef={tocRef}
                onSectionSelect={() => {}}
                onToggleGroup={() => {}}
                isFrameworkSection={() => false}
                resolveSectionStatus={(section) => section.status}
              />
            </aside>
            <section
              data-workspace-data-drawer-body
              data-particle-return-target="fixture-drawer"
              className="bg-background/95 absolute inset-x-2 bottom-2 max-h-[48%] overflow-auto rounded-2xl border shadow-lg md:inset-x-6"
            >
              <div className="flex items-center justify-between px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  Particles
                </Button>
                <span className="text-muted-foreground text-xs">
                  {collapsed
                    ? "Drop here to return an item"
                    : "Drag a tile onto the canvas"}
                </span>
              </div>
              <div className={collapsed ? "hidden" : "p-4 pt-0"}>
                <WorkspaceParticlesPanel />
              </div>
            </section>
          </div>
          <output data-particle-fixture-state className="sr-only">
            {JSON.stringify(state)}
          </output>
        </div>
      </main>
    </WorkspaceParticlesProvider>
  )
}
