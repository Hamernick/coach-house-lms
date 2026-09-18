"use client"

import { useState } from "react"
import ActivityIcon from "lucide-react/dist/esm/icons/activity"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import RouteIcon from "lucide-react/dist/esm/icons/route"
import TargetIcon from "lucide-react/dist/esm/icons/target"
import { cn } from "@/lib/utils"
import { particleImageUrl } from "../lib"
import type { ParticleKind, ParticleSource } from "../types"

const IMAGE_OUTLINE_CLASS_NAME =
  "outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"

const compactDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
})

export function ParticleIcon({
  kind,
  className,
}: {
  kind: ParticleKind
  className?: string
}) {
  const Icon =
    kind === "organization"
      ? Building2Icon
      : kind === "activity"
        ? ActivityIcon
        : kind === "plan"
          ? TargetIcon
          : kind === "image"
            ? ImageIcon
            : kind === "drive"
              ? FileTextIcon
              : RouteIcon
  return <Icon aria-hidden className={cn("size-5 shrink-0", className)} />
}

export function ParticleImageDisplay({
  source,
  className,
}: {
  source: ParticleSource
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!source.image || failed)
    return (
      <div className="text-muted-foreground grid h-full place-items-center p-3 text-center text-xs">
        Image unavailable
      </div>
    )
  // Private, authenticated endpoint; bypass the public Next image optimizer.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={particleImageUrl(source.image)}
      alt={source.title}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("size-full object-contain", className)}
    />
  )
}

function roadmapPreviewText(source: ParticleSource) {
  const content = source.section?.content ?? ""
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_`>|]/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function OrganizationPreview({ source }: { source: ParticleSource }) {
  const organization = source.organization
  if (!organization) return null
  return (
    <div className="bg-muted/35 relative flex size-full flex-col overflow-hidden">
      <div className="bg-muted/60 relative h-[58%] shrink-0 overflow-hidden">
        {organization.headerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={organization.headerUrl}
            alt=""
            loading="lazy"
            className={cn("size-full object-cover", IMAGE_OUTLINE_CLASS_NAME)}
          />
        ) : (
          <div className="from-muted to-background size-full bg-gradient-to-br" />
        )}
      </div>
      <div className="bg-card flex min-h-0 flex-1 items-center gap-2 px-2.5 py-2">
        <div
          className={cn(
            "bg-background relative -mt-5 grid size-9 shrink-0 place-items-center overflow-hidden rounded-[8px]",
            IMAGE_OUTLINE_CLASS_NAME
          )}
        >
          {organization.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={organization.logoUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <Building2Icon className="text-muted-foreground size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{organization.title}</p>
          <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
            {organization.programsCount} programs · {organization.peopleCount}{" "}
            people
          </p>
        </div>
      </div>
    </div>
  )
}

function ActivityPreview({ source }: { source: ParticleSource }) {
  const activities = source.activities ?? []
  const latest = activities[0]
  const date = latest ? new Date(latest.timestamp) : null
  return (
    <div className="flex size-full flex-col gap-2 p-2.5">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary grid size-7 place-items-center rounded-[8px]">
          <ActivityIcon className="size-3.5" />
        </div>
        <p className="text-muted-foreground text-[10px] tabular-nums">
          {activities.length} recent records
        </p>
      </div>
      {latest ? (
        <div className="bg-background/80 min-h-0 flex-1 rounded-[8px] px-2.5 py-2 outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10">
          <p className="line-clamp-2 text-xs leading-4 font-medium">
            {latest.title}
          </p>
          <p className="text-muted-foreground mt-1 text-[10px]">
            {date && Number.isFinite(date.getTime())
              ? compactDate.format(date)
              : "Date unavailable"}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground my-auto text-xs">
          Activity will appear here.
        </p>
      )}
    </div>
  )
}

function RoadmapPreview({ source }: { source: ParticleSource }) {
  const text = roadmapPreviewText(source) || source.description
  return (
    <div className="flex size-full flex-col overflow-hidden">
      {source.section?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source.section.imageUrl}
          alt=""
          loading="lazy"
          className={cn(
            "h-[58%] w-full shrink-0 object-cover",
            IMAGE_OUTLINE_CLASS_NAME
          )}
        />
      ) : null}
      <div className="min-h-0 flex-1 px-2.5 py-2">
        <p className="line-clamp-4 text-[11px] leading-4 whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </div>
  )
}

function ObjectivePreview({ source }: { source: ParticleSource }) {
  const steps = source.plan?.steps ?? []
  const completed = steps.filter((step) => step.complete).length
  const progress = steps.length
    ? Math.round((completed / steps.length) * 100)
    : 0
  return (
    <div className="flex size-full flex-col p-2.5">
      <div className="flex items-start gap-2">
        <TargetIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <p className="line-clamp-2 text-xs leading-4 font-medium">
          {source.plan?.title ?? source.title}
        </p>
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-2 text-[10px] leading-4">
        {source.plan?.summary || source.description}
      </p>
      <div className="mt-auto space-y-1.5">
        <div className="bg-muted h-1 overflow-hidden rounded-full">
          <div
            className="bg-foreground h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-muted-foreground text-[10px] tabular-nums">
          {completed} of {steps.length} steps
        </p>
      </div>
    </div>
  )
}

function DrivePreview({ source }: { source: ParticleSource }) {
  const mimeType = source.document?.mimeType ?? ""
  const type = mimeType.includes("spreadsheet")
    ? "Spreadsheet"
    : mimeType.includes("presentation")
      ? "Presentation"
      : mimeType.includes("document")
        ? "Document"
        : "Drive file"
  return (
    <div className="flex size-full flex-col items-start justify-between p-2.5">
      <div className="grid size-8 place-items-center rounded-[8px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <FileTextIcon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-xs leading-4 font-medium">
          {source.title}
        </p>
        <p className="text-muted-foreground mt-1 text-[10px]">{type}</p>
      </div>
    </div>
  )
}

export function ParticlePreview({ source }: { source: ParticleSource }) {
  if (source.ref.kind === "image")
    return (
      <ParticleImageDisplay
        source={source}
        className={cn("rounded-[10px] object-cover", IMAGE_OUTLINE_CLASS_NAME)}
      />
    )
  if (source.organization) return <OrganizationPreview source={source} />
  if (source.activities) return <ActivityPreview source={source} />
  if (source.section) return <RoadmapPreview source={source} />
  if (source.plan) return <ObjectivePreview source={source} />
  if (source.document) return <DrivePreview source={source} />
  return (
    <div className="text-muted-foreground grid size-full place-items-center">
      <ParticleIcon kind={source.ref.kind} className="size-6" />
    </div>
  )
}
