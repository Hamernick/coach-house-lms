"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"
import { useCallback, useState, type ReactNode } from "react"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useWorkspaceToolsController } from "../hooks/use-workspace-tools-controller"
import type { WorkspaceToolsInput } from "../types"
import { WorkspaceToolRow } from "./workspace-tool-row"

const WORKSPACE_TOOLS_PANEL_OWNER_PROPS = getReactGrabOwnerProps({
  ownerId: "workspace-tools:panel",
  component: "WorkspaceToolsPanel",
  source: "src/features/workspace-tools/components/workspace-tools-panel.tsx",
  slot: "root",
})

type WorkspaceToolsPanelProps = {
  input: WorkspaceToolsInput
}

export function WorkspaceToolsPanel({ input }: WorkspaceToolsPanelProps) {
  const [googleDriveConnected, setGoogleDriveConnected] = useState<
    boolean | null
  >(null)
  const handleGoogleDriveConnectionChange = useCallback(
    (connected: boolean) => setGoogleDriveConnected(connected),
    []
  )
  const {
    availableTools,
    clearQuery,
    installedTools,
    query,
    setQuery,
    stripeConnection,
  } = useWorkspaceToolsController(input, googleDriveConnected)
  const hasResults = installedTools.length > 0 || availableTools.length > 0

  return (
    <div
      {...WORKSPACE_TOOLS_PANEL_OWNER_PROPS}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6"
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Tools</h2>
        <p className="text-muted-foreground text-sm">
          Connect services to your organization workspace.
        </p>
      </header>

      <div className="relative">
        <Label htmlFor="workspace-tools-search" className="sr-only">
          Search tools
        </Label>
        <SearchIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          id="workspace-tools-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools…"
          className="h-11 pl-9 sm:h-9"
        />
      </div>

      {installedTools.length > 0 ? (
        <ToolSection title="Installed">
          {installedTools.map((tool) => (
            <WorkspaceToolRow
              key={tool.id}
              tool={tool}
              onGoogleDriveConnectionChange={handleGoogleDriveConnectionChange}
              stripeConnection={stripeConnection}
            />
          ))}
        </ToolSection>
      ) : null}

      {availableTools.length > 0 ? (
        <ToolSection title="Available">
          {availableTools.map((tool) => (
            <WorkspaceToolRow
              key={tool.id}
              tool={tool}
              onGoogleDriveConnectionChange={handleGoogleDriveConnectionChange}
              stripeConnection={stripeConnection}
            />
          ))}
        </ToolSection>
      ) : null}

      {!hasResults ? (
        <div className="border-border/70 flex flex-col items-start gap-3 rounded-xl border border-dashed p-5">
          <div>
            <p className="text-sm font-medium">No tools found</p>
            <p className="text-muted-foreground text-sm">
              Try a different search or clear the current one.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={clearQuery}>
            Clear search
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ToolSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const headingId = `workspace-tools-${title.toLowerCase()}`

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="mb-2 text-sm font-medium">
        {title}
      </h3>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}
