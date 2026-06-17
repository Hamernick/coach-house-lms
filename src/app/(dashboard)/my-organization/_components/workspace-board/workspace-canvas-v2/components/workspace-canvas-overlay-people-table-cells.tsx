"use client"

import { memo } from "react"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import GripVerticalIcon from "lucide-react/dist/esm/icons/grip-vertical"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import XIcon from "lucide-react/dist/esm/icons/x"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PERSON_CATEGORY_META } from "@/lib/people/categories"
import { cn } from "@/lib/utils"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"

function getInitials(name?: string | null) {
  if (!name?.trim()) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
}

const WorkspacePersonAvatar = memo(function WorkspacePersonAvatar({
  person,
}: {
  person: OrgPersonWithImage
}) {
  const isSupporter = person.category === "supporters"

  return (
    <Avatar
      className={cn(
        "border-border/70 bg-muted/70 size-8 border",
        isSupporter && "rounded-xl"
      )}
    >
      <AvatarImage
        src={person.displayImage ?? person.image ?? undefined}
        alt={person.name}
        className={cn(isSupporter && "object-contain p-1.5")}
      />
      <AvatarFallback
        className={cn("text-xs font-semibold", isSupporter && "rounded-xl")}
      >
        {getInitials(person.name)}
      </AvatarFallback>
    </Avatar>
  )
})

export function WorkspacePeopleDrawerPersonCell({
  person,
  placed,
}: {
  person: OrgPersonWithImage
  placed: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <WorkspacePersonAvatar person={person} />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-semibold",
            placed ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {person.name}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {person.title || "No title"}
        </p>
      </div>
    </div>
  )
}

export function WorkspacePeopleDrawerRelationshipCell({
  person,
}: {
  person: OrgPersonWithImage
}) {
  const categoryMeta = PERSON_CATEGORY_META[person.category]

  return (
    <span className="border-border bg-muted/40 text-muted-foreground inline-flex h-6 items-center gap-2 rounded-full border px-2 text-xs font-medium">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", categoryMeta.dotClass)}
        aria-hidden
      />
      {categoryMeta.label}
    </span>
  )
}

export function WorkspacePeopleDrawerReportsToCell({
  person,
  peopleById,
}: {
  person: OrgPersonWithImage
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
}) {
  if (person.category !== "staff") {
    return <span className="text-muted-foreground">-</span>
  }

  const manager = person.reportsToId ? peopleById.get(person.reportsToId) : null

  return manager ? (
    <span className="text-foreground text-sm">{manager.name}</span>
  ) : (
    <span className="text-muted-foreground">-</span>
  )
}

export function WorkspacePeopleDrawerEmailCell({
  person,
}: {
  person: OrgPersonWithImage
}) {
  const email = person.email?.trim()
  if (!email) return <span className="text-muted-foreground">-</span>

  return (
    <a
      href={`mailto:${email}`}
      className="text-foreground underline-offset-4 hover:underline"
    >
      {email}
    </a>
  )
}

export function WorkspacePeopleDrawerLinkedInCell({
  person,
}: {
  person: OrgPersonWithImage
}) {
  const linkedIn = person.linkedin?.trim()
  if (!linkedIn) return <span className="text-muted-foreground">-</span>

  const href = linkedIn.startsWith("http")
    ? linkedIn
    : `https://www.linkedin.com/in/${linkedIn.replace(/^\//, "")}`
  let label = "LinkedIn"

  try {
    const parsed = new URL(href)
    label = parsed.hostname.replace(/^www\./, "")
  } catch {
    label = linkedIn.replace(/^https?:\/\//, "")
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground inline-flex max-w-full items-center gap-1 underline-offset-4 hover:underline"
    >
      <span className="truncate">{label}</span>
      <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden />
    </a>
  )
}

export function WorkspacePeopleDrawerSegmentActionCell({
  person,
  customSegment,
  customSegmentMemberIds,
  onAdd,
  onRemove,
}: {
  person: OrgPersonWithImage
  customSegment: WorkspaceCustomPeopleSegment
  customSegmentMemberIds: ReadonlySet<string> | null
  onAdd: (personId: string) => void
  onRemove: (personId: string) => void
}) {
  const includedInCustomSegment = Boolean(
    customSegmentMemberIds?.has(person.id)
  )

  return includedInCustomSegment ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground h-8 rounded-xl px-2.5 text-xs"
      onClick={() => onRemove(person.id)}
      aria-label={`Remove ${person.name} from ${customSegment.label}`}
      title={`Remove ${person.name} from ${customSegment.label}`}
    >
      <XIcon aria-hidden />
      Remove from segment
    </Button>
  ) : (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-8 rounded-xl px-2.5 text-xs shadow-none"
      onClick={() => onAdd(person.id)}
      aria-label={`Add ${person.name} to ${customSegment.label}`}
      title={`Add ${person.name} to ${customSegment.label}`}
    >
      <PlusIcon aria-hidden />
      Add to segment
    </Button>
  )
}

export function WorkspacePeopleDrawerCanvasCell({
  person,
  placed,
}: {
  person: OrgPersonWithImage
  placed: boolean
}) {
  return (
    <div className="ml-auto flex items-center justify-end gap-1.5">
      {placed ? (
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
          On canvas
        </span>
      ) : null}
      <span
        className="text-muted-foreground/70 group-hover:bg-muted group-hover:text-foreground flex size-7 items-center justify-center rounded-lg transition-[background-color,color,opacity]"
        data-workspace-people-drag-handle="true"
        title={
          placed
            ? `Drag ${person.name} to reposition on canvas`
            : `Drag ${person.name} to canvas or segment`
        }
        aria-hidden
      >
        <GripVerticalIcon className="h-4 w-4" />
      </span>
    </div>
  )
}
