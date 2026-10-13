"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import ImagePlusIcon from "lucide-react/dist/esm/icons/image-plus"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { particleSourceKey } from "../lib"
import { useWorkspaceParticles } from "./particle-context"
import { ParticleTile } from "./particle-tile"
import { useParticleDrivePicker } from "../hooks/use-particle-drive-picker"

const EMPTY_REFRESH = async () => {}
const EMPTY_PICKER = async (): Promise<string[]> => []

export function WorkspaceParticlesPanel() {
  const controller = useWorkspaceParticles()
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)
  const picker = useParticleDrivePicker(
    controller?.canEdit ?? false,
    controller?.refreshDrive ?? EMPTY_REFRESH,
    controller?.pickDriveFiles ?? EMPTY_PICKER
  )
  if (!controller) return null
  const sources = controller.sources.filter(
    (source) =>
      (filter === "all" || source.ref.kind === filter) &&
      source.title
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())
  )
  return (
    <section
      data-particle-return-target="library"
      {...getReactGrabOwnerProps({
        ownerId: "workspace:particles",
        component: "WorkspaceParticlesPanel",
        source:
          "src/features/workspace-particles/components/workspace-particles-panel.tsx",
        slot: "root",
      })}
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6",
        controller.draggingNode && "ring-ring ring-2 ring-inset"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Particles</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Drag onto your canvas. Bring ideas together.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!controller.canEdit}
            onClick={() => controller.setEditingPlan("new")}
          >
            Plan objective
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!controller.canEdit || picker.pending}
            onClick={() => void picker.choose()}
          >
            {picker.pending ? "Opening Drive…" : "Add Drive file"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!controller.canEdit || controller.uploading}
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlusIcon data-icon="inline-start" />
            {controller.uploading ? "Uploading…" : "Add image"}
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Upload a canvas image"
          disabled={!controller.canEdit || controller.uploading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void controller.uploadImage(file)
            event.target.value = ""
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => {
            if (value) setFilter(value)
          }}
          variant="outline"
          size="sm"
          aria-label="Particle type"
        >
          {[
            ["all", "All"],
            ["roadmap", "Roadmap"],
            ["plan", "Objectives"],
            ["drive", "Drive"],
            ["image", "Images"],
          ].map(([value, label]) => (
            <ToggleGroupItem key={value} value={value}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Find a particle…"
          aria-label="Find a particle"
          className="h-9 w-full sm:w-56"
        />
      </div>
      {!controller.canEdit ? (
        <p className="text-muted-foreground text-sm">
          You have view-only access to this canvas.
        </p>
      ) : null}
      {filter === "drive" && controller.driveStatus === "loading" ? (
        <div
          aria-label="Loading Drive files"
          className="grid grid-cols-2 gap-4"
        >
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : null}
      {controller.driveStatus === "error" &&
      (filter === "all" || filter === "drive") ? (
        <div
          role="status"
          className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm"
        >
          Drive files couldn’t be loaded.
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void controller.refreshDrive()}
          >
            Retry
          </Button>
          <Button variant="link" size="sm" asChild>
            <Link href="/workspace?drawer=tools">Manage Drive</Link>
          </Button>
        </div>
      ) : null}
      {sources.length ? (
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sources.map((source) => (
            <ParticleTile key={particleSourceKey(source.ref)} source={source} />
          ))}
        </div>
      ) : controller.driveStatus !== "loading" || filter !== "drive" ? (
        <Empty
          size="sm"
          title="No particles here yet"
          description={
            filter === "drive"
              ? "Use Add Drive file to choose a document. Connect Drive in Tools if needed."
              : filter === "image"
                ? "Add an image to start."
                : "Try another search or category."
          }
        />
      ) : null}
      <p className="text-muted-foreground text-xs">
        Return an item here to remove it from the canvas. Its original stays
        available.
      </p>
    </section>
  )
}
