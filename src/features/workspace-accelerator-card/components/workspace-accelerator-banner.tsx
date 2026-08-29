"use client"

import GraduationCapIcon from "lucide-react/dist/esm/icons/graduation-cap"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"

const WORKSPACE_ACCELERATOR_BANNER_SOURCE =
  "src/features/workspace-accelerator-card/components/workspace-accelerator-banner.tsx"

const WORKSPACE_ACCELERATOR_BANNER_OWNER_PROPS = getReactGrabOwnerProps({
  ownerId: "workspace-accelerator:banner",
  component: "WorkspaceAcceleratorBanner",
  source: WORKSPACE_ACCELERATOR_BANNER_SOURCE,
  slot: "root",
  canonicalOwnerSource: WORKSPACE_ACCELERATOR_BANNER_SOURCE,
  canonicalOwnerReason:
    "WorkspaceAcceleratorBanner owns the Accelerator drawer introduction.",
})

export function WorkspaceAcceleratorBanner() {
  return (
    <section
      {...WORKSPACE_ACCELERATOR_BANNER_OWNER_PROPS}
      className="border-border/70 mx-auto mt-4 w-full max-w-3xl rounded-2xl border bg-zinc-100/80 px-4 py-4 text-center sm:px-5 sm:py-5 dark:bg-zinc-900/30"
    >
      <div className="mx-auto flex max-w-[68ch] min-w-0 flex-col items-center">
        <span className="border-border/70 bg-background text-muted-foreground inline-flex size-12 shrink-0 origin-center items-center justify-center rounded-2xl border shadow-xs motion-safe:animate-[soft-pop_600ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none">
          <GraduationCapIcon className="size-5" aria-hidden />
        </span>
        <h2
          id="workspace-accelerator-title"
          className="text-foreground mt-3 max-w-[30ch] text-lg font-semibold text-balance sm:text-xl"
        >
          Build your organization with guided lessons.
        </h2>
        <p className="text-muted-foreground mt-2.5 max-w-[60ch] text-sm leading-relaxed text-pretty">
          Move through guided videos, resources, and assignments while your
          progress stays connected to this workspace.
        </p>
      </div>
    </section>
  )
}
