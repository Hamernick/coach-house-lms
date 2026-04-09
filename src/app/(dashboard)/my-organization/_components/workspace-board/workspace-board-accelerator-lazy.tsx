"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

import { Skeleton } from "@/components/ui/skeleton"

type WorkspaceAcceleratorCardPanelProps = ComponentProps<
  typeof import("@/features/workspace-accelerator-card").WorkspaceAcceleratorCardPanel
>

type WorkspaceAcceleratorHeaderPickerProps = ComponentProps<
  typeof import("@/features/workspace-accelerator-card").WorkspaceAcceleratorHeaderPicker
>

type WorkspaceAcceleratorStepNodeCardProps = ComponentProps<
  typeof import("@/features/workspace-accelerator-card").WorkspaceAcceleratorStepNodeCard
>

function WorkspaceBoardAcceleratorCardPanelFallback() {
  return (
    <div className="flex min-h-[28rem] flex-1 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  )
}

function WorkspaceBoardAcceleratorHeaderPickerFallback() {
  return <Skeleton className="h-8 w-[196px] rounded-xl" />
}

function WorkspaceBoardAcceleratorStepNodeCardFallback() {
  return (
    <div className="w-full rounded-[24px] border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-7 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
      </div>
    </div>
  )
}

export const WorkspaceBoardLazyAcceleratorCardPanel =
  dynamic<WorkspaceAcceleratorCardPanelProps>(
    () =>
      import("@/features/workspace-accelerator-card").then(
        (mod) => mod.WorkspaceAcceleratorCardPanel,
      ),
    {
      loading: () => <WorkspaceBoardAcceleratorCardPanelFallback />,
    },
  )

export const WorkspaceBoardLazyAcceleratorHeaderPicker =
  dynamic<WorkspaceAcceleratorHeaderPickerProps>(
    () =>
      import("@/features/workspace-accelerator-card").then(
        (mod) => mod.WorkspaceAcceleratorHeaderPicker,
      ),
    {
      loading: () => <WorkspaceBoardAcceleratorHeaderPickerFallback />,
    },
  )

export const WorkspaceBoardLazyAcceleratorStepNodeCard =
  dynamic<WorkspaceAcceleratorStepNodeCardProps>(
    () =>
      import("@/features/workspace-accelerator-card").then(
        (mod) => mod.WorkspaceAcceleratorStepNodeCard,
      ),
    {
      loading: () => <WorkspaceBoardAcceleratorStepNodeCardFallback />,
    },
  )
