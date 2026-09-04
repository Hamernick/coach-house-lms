"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import NotebookPenIcon from "lucide-react/dist/esm/icons/notebook-pen"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import XIcon from "lucide-react/dist/esm/icons/x"
import { parseAsString, useQueryState } from "nuqs"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { ModuleNoteIndexEntry } from "@/lib/modules/notes-index"
import { cn } from "@/lib/utils"

const ALL_CLASSES_FILTER = "__all_classes__"
const LONG_NOTE_PREVIEW_THRESHOLD = 320

function formatUpdatedAt(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Recently updated"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}

function buildLocationLabel(note: ModuleNoteIndexEntry) {
  const parts: string[] = []
  if (
    typeof note.moduleIndex === "number" &&
    Number.isFinite(note.moduleIndex)
  ) {
    parts.push(`Module ${note.moduleIndex}`)
  }
  if (note.classTitle) {
    parts.push(note.classTitle)
  }
  return parts.join(" • ")
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}

function buildCollapsedPreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim()
  if (normalized.length <= LONG_NOTE_PREVIEW_THRESHOLD) return normalized
  return `${normalized.slice(0, LONG_NOTE_PREVIEW_THRESHOLD).trimEnd()}…`
}

function noteIsLong(content: string) {
  return (
    content.trim().length > LONG_NOTE_PREVIEW_THRESHOLD ||
    content.split("\n").length > 5
  )
}

function noteListKey(note: ModuleNoteIndexEntry) {
  return `${note.moduleId}:${note.updatedAt}`
}

export function DocumentsNotesPanel({
  notes,
}: {
  notes: ModuleNoteIndexEntry[]
}) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "notes_q",
    parseAsString.withDefault("")
  )
  const [classFilter, setClassFilter] = useQueryState(
    "notes_class",
    parseAsString.withDefault(ALL_CLASSES_FILTER)
  )
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})

  const classOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: string[] = []
    for (const note of notes) {
      const label = note.classTitle?.trim()
      if (!label) continue
      if (seen.has(label)) continue
      seen.add(label)
      options.push(label)
    }
    return options.sort((a, b) => a.localeCompare(b))
  }, [notes])

  const normalizedQuery = useMemo(
    () => normalizeSearchText(searchQuery),
    [searchQuery]
  )

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (
        classFilter !== ALL_CLASSES_FILTER &&
        (note.classTitle ?? "") !== classFilter
      ) {
        return false
      }
      if (!normalizedQuery) return true
      const haystack = [
        note.moduleTitle,
        note.classTitle ?? "",
        note.content,
        typeof note.moduleIndex === "number" ? String(note.moduleIndex) : "",
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [classFilter, normalizedQuery, notes])

  const hasFiltersApplied =
    Boolean(normalizedQuery) || classFilter !== ALL_CLASSES_FILTER

  const toggleExpanded = (key: string) => {
    setExpandedKeys((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  const resetFilters = () => {
    void setSearchQuery("")
    void setClassFilter(ALL_CLASSES_FILTER)
  }

  return (
    <section className="mt-6" aria-labelledby="documents-notes-title">
      <Card className="bg-muted/80 ring-border/60 overflow-hidden rounded-[2rem] border-0 shadow-none ring-1 dark:bg-[#303030]">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle
              id="documents-notes-title"
              className="flex items-center gap-2 text-base"
            >
              <NotebookPenIcon
                className="text-muted-foreground h-4 w-4"
                aria-hidden
              />
              Notes
            </CardTitle>
            {notes.length > 0 ? (
              <Badge
                variant="secondary"
                className="h-6 px-2 text-[11px] tabular-nums"
              >
                {notes.length}
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-5 pt-0 pb-5">
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Notes you save in accelerator modules will appear here so you can
              revisit them from Documents.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <SearchIcon
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    value={searchQuery}
                    onChange={(event) => {
                      void setSearchQuery(event.target.value)
                    }}
                    placeholder="Search notes…"
                    aria-label="Search notes"
                    className="h-9 pr-9 pl-9"
                  />
                  {searchQuery.trim().length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7"
                      onClick={() => {
                        void setSearchQuery("")
                      }}
                      aria-label="Clear note search"
                    >
                      <XIcon className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={classFilter}
                    onValueChange={(value) => {
                      void setClassFilter(value)
                    }}
                  >
                    <SelectTrigger size="sm" className="h-9 min-w-0 flex-1">
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CLASSES_FILTER}>
                        All classes
                      </SelectItem>
                      {classOptions.map((classTitle) => (
                        <SelectItem
                          key={`notes-class-${classTitle}`}
                          value={classTitle}
                        >
                          {classTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasFiltersApplied ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 shrink-0 px-2.5"
                      onClick={resetFilters}
                    >
                      Reset
                    </Button>
                  ) : null}
                </div>
              </div>

              <Separator />

              {filteredNotes.length === 0 ? (
                <div className="border-border/60 text-muted-foreground rounded-xl border border-dashed px-3 py-3 text-xs">
                  No notes match your search or filter.
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredNotes.map((note, index) => {
                    const key = noteListKey(note)
                    const isExpanded = Boolean(expandedKeys[key])
                    const isLong = noteIsLong(note.content)

                    return (
                      <div key={key}>
                        {index > 0 ? <Separator className="my-3" /> : null}
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <p className="text-foreground line-clamp-1 text-sm font-medium">
                              {note.moduleTitle}
                            </p>
                            <p className="text-muted-foreground line-clamp-1 text-xs">
                              {buildLocationLabel(note) || "Accelerator module"}{" "}
                              • {formatUpdatedAt(note.updatedAt)}
                            </p>
                          </div>

                          <p
                            className={cn(
                              "text-foreground/90 text-xs leading-5 break-words",
                              isExpanded && "whitespace-pre-wrap"
                            )}
                          >
                            {isExpanded
                              ? note.content
                              : buildCollapsedPreview(note.content)}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {isLong ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-[11px]"
                                onClick={() => toggleExpanded(key)}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? "Collapse" : "Read more"}
                              </Button>
                            ) : null}

                            {note.href ? (
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5 px-2.5 text-[11px]"
                              >
                                <Link href={note.href}>
                                  <ArrowUpRightIcon
                                    className="h-3.5 w-3.5"
                                    aria-hidden
                                  />
                                  Open module
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
