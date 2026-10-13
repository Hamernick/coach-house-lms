"use client"

import { memo, useEffect, useState, useTransition } from "react"
import EllipsisIcon from "lucide-react/dist/esm/icons/ellipsis"
import GripVerticalIcon from "lucide-react/dist/esm/icons/grip-vertical"
import MonitorUpIcon from "lucide-react/dist/esm/icons/monitor-up"
import MonitorXIcon from "lucide-react/dist/esm/icons/monitor-x"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import UserMinusIcon from "lucide-react/dist/esm/icons/user-minus"
import UserPlusIcon from "lucide-react/dist/esm/icons/user-plus"

import { updatePersonCategoryAction } from "@/actions/people"
import { PersonSocialBrandIcon } from "@/components/people/person-social-brand-icon"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PERSON_CATEGORY_META,
  PERSON_CATEGORY_OPTIONS,
} from "@/lib/people/categories"
import {
  PERSON_SOCIAL_PLATFORMS,
  readPersonSocialLinks,
  resolvePersonSocialHref,
} from "@/lib/people/social-links"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import type {
  WorkspacePeopleTableContentMode,
  WorkspacePeopleTableRowHeight,
} from "./workspace-canvas-overlay-people-table-sizing"

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
  contentMode = "wrap",
  rowHeight = "standard",
  onOpenPerson,
}: {
  person: OrgPersonWithImage
  placed: boolean
  contentMode?: WorkspacePeopleTableContentMode
  rowHeight?: WorkspacePeopleTableRowHeight
  onOpenPerson: (person: OrgPersonWithImage) => void
}) {
  const title = person.title || "No title"
  const wrapName = contentMode === "wrap"
  const wrapTitle = contentMode === "wrap" && rowHeight !== "compact"

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full min-w-0 justify-start gap-3 p-0 text-left font-normal hover:bg-transparent"
      onClick={() => onOpenPerson(person)}
    >
      <WorkspacePersonAvatar person={person} />
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold",
            wrapName
              ? "line-clamp-2 break-words whitespace-normal"
              : "truncate",
            placed ? "text-muted-foreground" : "text-foreground"
          )}
          title={person.name}
        >
          {person.name}
        </p>
        <p
          className={cn(
            "text-muted-foreground text-xs",
            wrapTitle
              ? "line-clamp-2 text-pretty break-words whitespace-normal"
              : "truncate"
          )}
          title={title}
        >
          {title}
        </p>
      </div>
    </Button>
  )
}

export function WorkspacePeopleDrawerRelationshipCell({
  person,
  canEdit = false,
}: {
  person: OrgPersonWithImage
  canEdit?: boolean
}) {
  const [selectedCategory, setSelectedCategory] = useState(person.category)
  const [isPending, startTransition] = useTransition()
  const categoryMeta = PERSON_CATEGORY_META[selectedCategory]

  useEffect(() => {
    setSelectedCategory(person.category)
  }, [person.category])

  const roleLabel = (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", categoryMeta.dotClass)}
        aria-hidden
      />
      <span className="truncate">{categoryMeta.label}</span>
    </span>
  )

  if (!canEdit) {
    return (
      <span className="border-border bg-muted/40 text-muted-foreground inline-flex h-6 items-center gap-2 rounded-full border px-2 text-xs font-medium">
        {roleLabel}
      </span>
    )
  }

  const handleRelationshipChange = (value: string) => {
    const nextCategory = PERSON_CATEGORY_OPTIONS.find(
      (option) => option.value === value
    )?.value
    if (!nextCategory || nextCategory === selectedCategory) return

    const previousCategory = selectedCategory
    setSelectedCategory(nextCategory)
    startTransition(async () => {
      const result = await updatePersonCategoryAction(person.id, nextCategory)
      if ("error" in result) {
        setSelectedCategory(previousCategory)
        toast.error("Unable to update role.", {
          description: result.error,
        })
      }
    })
  }

  return (
    <Select
      value={selectedCategory}
      onValueChange={handleRelationshipChange}
      disabled={isPending}
    >
      <SelectTrigger
        size="sm"
        aria-label={`Change role for ${person.name}`}
        className="border-border bg-muted/40 text-muted-foreground h-6 w-fit min-w-0 gap-2 rounded-full px-2 text-xs font-medium shadow-none [&>svg]:size-3"
      >
        <SelectValue>{roleLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-44">
        <SelectGroup>
          {PERSON_CATEGORY_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              icon={
                <span
                  className={cn(
                    "size-2 rounded-full",
                    PERSON_CATEGORY_META[option.value].dotClass
                  )}
                  aria-hidden
                />
              }
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
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

export function WorkspacePeopleDrawerSocialMediaCell({
  person,
  canEdit,
  onEditPerson,
}: {
  person: OrgPersonWithImage
  canEdit: boolean
  onEditPerson: (person: OrgPersonWithImage) => void
}) {
  const socialLinks = readPersonSocialLinks(person)
  const visiblePlatforms = PERSON_SOCIAL_PLATFORMS.filter((platform) =>
    resolvePersonSocialHref(platform.key, socialLinks[platform.key])
  )
  const platformLabel = visiblePlatforms
    .map((platform) => platform.label)
    .join(", ")
  const actionLabel = canEdit
    ? platformLabel
      ? `View and edit ${platformLabel} for ${person.name}`
      : `Add social media for ${person.name}`
    : `${platformLabel || "No social media"} for ${person.name}`

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-full justify-start gap-1 rounded-lg px-1"
      aria-label={actionLabel}
      title={actionLabel}
      draggable={false}
      onClick={() => onEditPerson(person)}
      onDragStart={(event) => event.stopPropagation()}
    >
      {visiblePlatforms.length > 0 ? (
        visiblePlatforms.map((platform) => (
          <PersonSocialBrandIcon
            key={platform.key}
            platform={platform.key}
            className="shrink-0"
            aria-hidden
          />
        ))
      ) : (
        <PlusIcon className="text-muted-foreground/45" aria-hidden />
      )}
    </Button>
  )
}

export function WorkspacePeopleDrawerActionCell({
  person,
  placed,
  customSegment,
  customSegmentMemberIds,
  onAddToCanvas,
  onRemoveFromCanvas,
  onAddToSegment,
  onRemoveFromSegment,
}: {
  person: OrgPersonWithImage
  placed: boolean
  customSegment: WorkspaceCustomPeopleSegment | null
  customSegmentMemberIds: ReadonlySet<string> | null
  onAddToCanvas: (personIds: string[]) => number
  onRemoveFromCanvas: (personId: string) => void
  onAddToSegment: (personId: string) => void
  onRemoveFromSegment: (personId: string) => void
}) {
  const includedInCustomSegment = Boolean(
    customSegmentMemberIds?.has(person.id)
  )

  const handleAddToCanvas = () => {
    const placedCount = onAddToCanvas([person.id])
    if (placedCount > 0) {
      toast.success("Added to canvas")
      return
    }
    toast.error("Unable to add person to canvas.")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Actions for ${person.name}`}
          title={`Actions for ${person.name}`}
        >
          <EllipsisIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          {placed ? (
            <DropdownMenuItem onSelect={() => onRemoveFromCanvas(person.id)}>
              <MonitorXIcon aria-hidden />
              Remove from canvas
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={handleAddToCanvas}>
              <MonitorUpIcon aria-hidden />
              Add to canvas
            </DropdownMenuItem>
          )}
          {customSegment ? (
            includedInCustomSegment ? (
              <DropdownMenuItem onSelect={() => onRemoveFromSegment(person.id)}>
                <UserMinusIcon aria-hidden />
                Remove from segment
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onAddToSegment(person.id)}>
                <UserPlusIcon aria-hidden />
                Add to segment
              </DropdownMenuItem>
            )
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
    <div className="ml-auto flex items-center justify-end">
      {placed ? <span className="sr-only">On canvas</span> : null}
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
        <GripVerticalIcon className="size-4" />
      </span>
    </div>
  )
}
