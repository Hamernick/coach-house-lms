"use client"

import { useMemo, useState } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  normalizePersonTag,
  type OrganizationPeopleTag,
  type OrganizationPeopleTagColor,
} from "@/lib/people/tags"
import { cn } from "@/lib/utils"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import { WorkspacePeopleTagBadge } from "./workspace-canvas-people-tag-badge"
import { WorkspacePeopleTagEditorDialog } from "./workspace-canvas-people-tag-editor-dialog"
import {
  SegmentPreview,
  TagPreview,
} from "./workspace-canvas-overlay-people-table-multi-value-preview"
import type {
  WorkspacePeopleTableContentMode,
  WorkspacePeopleTableRowHeight,
} from "./workspace-canvas-overlay-people-table-sizing"

export function WorkspacePeopleDrawerSegmentsCell({
  person,
  segments,
  canEdit,
  contentMode = "wrap",
  rowHeight = "standard",
  open: controlledOpen,
  onOpenChange,
  onAdd,
  onCreate,
  onRemove,
}: {
  person: OrgPersonWithImage
  segments: WorkspaceCustomPeopleSegment[]
  canEdit: boolean
  contentMode?: WorkspacePeopleTableContentMode
  rowHeight?: WorkspacePeopleTableRowHeight
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAdd: (segmentId: string, personId: string) => void
  onCreate: (label: string, personId: string) => void
  onRemove: (segmentId: string, personId: string) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [query, setQuery] = useState("")
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }
  const selectedSegments = segments.filter((segment) =>
    segment.memberIds.includes(person.id)
  )
  const selectedSegmentIds = new Set(
    selectedSegments.map((segment) => segment.id)
  )
  const labels = selectedSegments.map((segment) => segment.label)
  const normalizedQuery = query.trim().replace(/\s+/g, " ").slice(0, 48)
  const matchingSegments = useMemo(() => {
    const normalizedSearch = normalizedQuery.toLocaleLowerCase()
    if (!normalizedSearch) return segments
    return segments.filter((segment) =>
      segment.label.toLocaleLowerCase().includes(normalizedSearch)
    )
  }, [normalizedQuery, segments])
  const exactSegmentExists = segments.some(
    (segment) =>
      segment.label.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase()
  )

  const handleCreateSegment = () => {
    if (!normalizedQuery || exactSegmentExists) return
    onCreate(normalizedQuery, person.id)
    setQuery("")
    setOpen(false)
  }

  if (!canEdit) {
    return (
      <SegmentPreview
        emptyLabel="None"
        labels={labels}
        contentMode={contentMode}
        rowHeight={rowHeight}
      />
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto min-h-7 w-fit max-w-full min-w-0 justify-start rounded-lg bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
            labels.length === 0 && "h-8 w-full px-1"
          )}
          aria-label={`Change segments for ${person.name}`}
          onDragStart={(event) => event.stopPropagation()}
        >
          {labels.length > 0 ? (
            <SegmentPreview
              emptyLabel="None"
              labels={labels}
              contentMode={contentMode}
              rowHeight={rowHeight}
            />
          ) : (
            <PlusIcon className="text-muted-foreground/45" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Find or create segments…"
          />
          <CommandList aria-multiselectable="true">
            <CommandEmpty>No segments found.</CommandEmpty>
            {matchingSegments.length > 0 ? (
              <CommandGroup heading="Segments">
                {matchingSegments.map((segment) => {
                  const selected = selectedSegmentIds.has(segment.id)
                  return (
                    <CommandItem
                      key={segment.id}
                      value={`${segment.label} ${segment.id}`}
                      aria-selected={selected}
                      onSelect={() =>
                        selected
                          ? onRemove(segment.id, person.id)
                          : onAdd(segment.id, person.id)
                      }
                    >
                      <CheckIcon
                        className={cn("opacity-0", selected && "opacity-100")}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {segment.label}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ) : null}
            {normalizedQuery && !exactSegmentExists ? (
              <CommandGroup>
                <CommandItem
                  value={`create-${normalizedQuery}`}
                  onSelect={handleCreateSegment}
                >
                  <PlusIcon aria-hidden />
                  Create “{normalizedQuery}”
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function WorkspacePeopleDrawerTagsCell({
  person,
  tags,
  canEdit,
  contentMode = "wrap",
  rowHeight = "standard",
  open: controlledOpen,
  onOpenChange,
  onAdd,
  onCreate,
  onDelete,
  onRemove,
  onUpdate,
}: {
  person: OrgPersonWithImage
  tags: OrganizationPeopleTag[]
  canEdit: boolean
  contentMode?: WorkspacePeopleTableContentMode
  rowHeight?: WorkspacePeopleTableRowHeight
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAdd: (tagId: string, personId: string) => Promise<boolean>
  onCreate: (input: {
    color: OrganizationPeopleTagColor
    label: string
    personId?: string
  }) => Promise<boolean>
  onDelete: (tagId: string) => Promise<boolean>
  onRemove: (tagId: string, personId: string) => Promise<boolean>
  onUpdate: (input: {
    color: OrganizationPeopleTagColor
    label: string
    tagId: string
  }) => Promise<boolean>
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [query, setQuery] = useState("")
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }
  const [editorState, setEditorState] = useState<
    | { mode: "create"; initialLabel: string }
    | { mode: "edit"; tag: OrganizationPeopleTag }
    | null
  >(null)
  const selectedTags = useMemo(
    () => tags.filter((tag) => tag.memberIds.includes(person.id)),
    [person.id, tags]
  )
  const normalizedQuery = normalizePersonTag(query)
  const matchingTags = useMemo(() => {
    const normalizedSearch = normalizedQuery.toLocaleLowerCase()
    if (!normalizedSearch) return tags
    return tags.filter((tag) =>
      tag.label.toLocaleLowerCase().includes(normalizedSearch)
    )
  }, [normalizedQuery, tags])
  const exactTagExists = tags.some(
    (tag) =>
      tag.label.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase()
  )

  const openCreateEditor = () => {
    setOpen(false)
    setEditorState({ mode: "create", initialLabel: normalizedQuery })
  }

  const openEditEditor = (tag: OrganizationPeopleTag) => {
    setOpen(false)
    setEditorState({ mode: "edit", tag })
  }

  if (!canEdit) {
    return (
      <TagPreview
        tags={selectedTags}
        contentMode={contentMode}
        rowHeight={rowHeight}
      />
    )
  }

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setQuery("")
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto min-h-7 w-fit max-w-full min-w-0 justify-start rounded-lg bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
              selectedTags.length === 0 && "h-8 w-full px-1"
            )}
            aria-label={`Change tags for ${person.name}`}
            onDragStart={(event) => event.stopPropagation()}
          >
            {selectedTags.length > 0 ? (
              <TagPreview
                tags={selectedTags}
                contentMode={contentMode}
                rowHeight={rowHeight}
              />
            ) : (
              <PlusIcon className="text-muted-foreground/45" aria-hidden />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Find tags…"
            />
            <CommandList aria-multiselectable="true">
              <CommandEmpty>No tags found.</CommandEmpty>
              {matchingTags.length > 0 ? (
                <CommandGroup heading="Tags">
                  {matchingTags.map((tag) => {
                    const selected = tag.memberIds.includes(person.id)
                    return (
                      <div key={tag.id} className="flex min-w-0 items-center">
                        <CommandItem
                          value={`${tag.label} ${tag.id}`}
                          aria-selected={selected}
                          className="min-w-0 flex-1"
                          onSelect={() =>
                            void (selected
                              ? onRemove(tag.id, person.id)
                              : onAdd(tag.id, person.id))
                          }
                        >
                          <CheckIcon
                            className={cn(
                              "opacity-0",
                              selected && "opacity-100"
                            )}
                            aria-hidden
                          />
                          <WorkspacePeopleTagBadge tag={tag} />
                        </CommandItem>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mr-1 size-7 shrink-0"
                          aria-label={`Edit ${tag.label}`}
                          onClick={() => openEditEditor(tag)}
                        >
                          <PencilIcon aria-hidden />
                        </Button>
                      </div>
                    )
                  })}
                </CommandGroup>
              ) : null}
              {normalizedQuery && !exactTagExists ? (
                <CommandGroup>
                  <CommandItem
                    value={`create-${normalizedQuery}`}
                    onSelect={openCreateEditor}
                  >
                    <PlusIcon aria-hidden />
                    Create “{normalizedQuery}”
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
            <div className="border-border border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={openCreateEditor}
              >
                <PlusIcon data-icon="inline-start" aria-hidden />
                New tag
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <WorkspacePeopleTagEditorDialog
        open={editorState !== null}
        tag={editorState?.mode === "edit" ? editorState.tag : undefined}
        initialLabel={
          editorState?.mode === "create" ? editorState.initialLabel : ""
        }
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditorState(null)
        }}
        onSave={(input) =>
          editorState?.mode === "edit"
            ? onUpdate({ ...input, tagId: editorState.tag.id })
            : onCreate({ ...input, personId: person.id })
        }
        onDelete={
          editorState?.mode === "edit"
            ? () => onDelete(editorState.tag.id)
            : undefined
        }
      />
    </>
  )
}
