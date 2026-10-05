"use client"

import { useState } from "react"
import { CircleNotch, Plus, SquaresFour, Table } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ProjectNote } from "../../lib/data/project-details"
import { NoteCard } from "./NoteCard"
import { NotesTable } from "./NotesTable"

type NotesCollectionProps = {
    notes: ProjectNote[]
    savingNoteId?: string
    onAddNote?: () => void
    onEditNote?: (noteId: string) => void
    onDeleteNote?: (noteId: string) => void
    onNoteClick: (note: ProjectNote) => void
}

export function NotesCollection({ notes, savingNoteId, onAddNote, onEditNote, onDeleteNote, onNoteClick }: NotesCollectionProps) {
    const [view, setView] = useState("individual")
    const [search, setSearch] = useState("")
    const filtered = notes.filter((note) =>
        note.id === savingNoteId || note.title.toLowerCase().includes(search.trim().toLowerCase()),
    )

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Input
                    type="search"
                    aria-label="Search notes"
                    placeholder="Search notes"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full sm:max-w-xs"
                />
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {onAddNote ? (
                        <Button variant="outline" size="sm" disabled={Boolean(savingNoteId)} onClick={() => { setSearch(""); onAddNote() }}>
                            <Plus />
                            Add note
                        </Button>
                    ) : null}
                    <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(value) => { if (value) setView(value) }} aria-label="Notes view">
                        <ToggleGroupItem value="individual" aria-label="Individual notes view"><SquaresFour />Individual</ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Table notes view"><Table />Table</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>
            <div role="status" aria-live="polite" className="flex min-h-5 items-center gap-2 text-sm text-muted-foreground">
                {savingNoteId ? <><CircleNotch className="size-4 motion-safe:animate-spin" />Saving note…</> : `${filtered.length} ${filtered.length === 1 ? "note" : "notes"}`}
            </div>
            {filtered.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">{search.trim() ? "No notes match your search." : "No notes yet."}</p>
            ) : view === "table" ? (
                <NotesTable notes={filtered} savingNoteId={savingNoteId} onEditNote={onEditNote} onDeleteNote={onDeleteNote} onNoteClick={onNoteClick} />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {filtered.map((note) => (
                        <NoteCard key={note.id} note={note} isSaving={note.id === savingNoteId} onEdit={onEditNote} onDelete={onDeleteNote} onClick={() => onNoteClick(note)} />
                    ))}
                </div>
            )}
        </div>
    )
}
