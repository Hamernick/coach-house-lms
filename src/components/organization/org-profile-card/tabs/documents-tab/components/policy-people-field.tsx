"use client"

import { useEffect, useMemo, useState } from "react"
import Search from "lucide-react/dist/esm/icons/search"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { DocumentsOption } from "../types"

type PolicyPeopleFieldProps = {
  open: boolean
  peopleOptions: DocumentsOption[]
  selectedPersonIds: string[]
  onChangePersonIds: (personIds: string[]) => void
}

export function PolicyPeopleField({
  open,
  peopleOptions,
  selectedPersonIds,
  onChangePersonIds,
}: PolicyPeopleFieldProps) {
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!open) setSearchQuery("")
  }, [open])

  const filteredPeopleOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return peopleOptions
    return peopleOptions.filter((person) => person.label.toLowerCase().includes(query))
  }, [peopleOptions, searchQuery])

  return (
    <div className="grid gap-2">
      <Label>Associated people</Label>
      {peopleOptions.length > 0 ? (
        <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60">
          <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search people…"
                className="h-8 border-border/70 bg-background pl-8 text-xs"
                aria-label="Search associated people"
              />
            </div>
          </div>

          {filteredPeopleOptions.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredPeopleOptions.map((person) => {
                const checked = selectedPersonIds.includes(person.id)
                return (
                  <label
                    key={person.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) => {
                        const selected = new Set(selectedPersonIds)
                        if (nextChecked === true) selected.add(person.id)
                        else selected.delete(person.id)
                        onChangePersonIds(Array.from(selected))
                      }}
                    />
                    <span className="text-sm text-foreground">{person.label}</span>
                  </label>
                )
              })}
            </div>
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No people match your search.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No people added yet.</p>
      )}
    </div>
  )
}
