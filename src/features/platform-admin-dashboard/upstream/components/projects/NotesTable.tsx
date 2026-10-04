"use client"

import { useState } from "react"
import { DotsThree } from "@phosphor-icons/react/dist/ssr"
import { format } from "date-fns"

import type { ProjectNote, NoteStatus } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { Button } from "@/features/platform-admin-dashboard/upstream/components/ui/button"
import { Badge } from "@/features/platform-admin-dashboard/upstream/components/ui/badge"
import { cn } from "@/features/platform-admin-dashboard/upstream/lib/utils"
import { Checkbox } from "@/features/platform-admin-dashboard/upstream/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/platform-admin-dashboard/upstream/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/platform-admin-dashboard/upstream/components/ui/table"

type NotesTableProps = {
    notes: ProjectNote[]
    savingNoteId?: string
    onEditNote?: (noteId: string) => void
    onDeleteNote?: (noteId: string) => void
    onNoteClick?: (note: ProjectNote) => void
}

export function NotesTable({ notes, savingNoteId, onEditNote, onDeleteNote, onNoteClick }: NotesTableProps) {
    const [selectedNotes, setSelectedNotes] = useState<string[]>([])
    const canManageNotes = Boolean(onEditNote || onDeleteNote)

    const filteredNotes = notes

    const toggleSelectAll = () => {
        if (selectedNotes.length === filteredNotes.length) {
            setSelectedNotes([])
        } else {
            setSelectedNotes(filteredNotes.map((note) => note.id))
        }
    }

    const toggleSelectNote = (noteId: string) => {
        setSelectedNotes((prev) =>
            prev.includes(noteId)
                ? prev.filter((id) => id !== noteId)
                : [...prev, noteId]
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={
                                        filteredNotes.length > 0 &&
                                        selectedNotes.length === filteredNotes.length
                                    }
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Added by</TableHead>
                            <TableHead>Added date</TableHead>
                            <TableHead>Status</TableHead>
                            {canManageNotes ? <TableHead className="w-12"></TableHead> : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredNotes.map((note) => (
                            <TableRow key={note.id} className="cursor-pointer motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" aria-busy={savingNoteId === note.id} onClick={() => onNoteClick?.(note)}>
                                <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedNotes.includes(note.id)}
                                        onCheckedChange={() => toggleSelectNote(note.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{note.title}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {note.addedBy.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {format(note.addedDate, "d MMM")}
                                </TableCell>
                                <TableCell>
                                    {savingNoteId === note.id ? <span role="status">Saving…</span> : <StatusBadge status={note.status} />}
                                </TableCell>
                                {canManageNotes ? (
                                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    aria-label={`Actions for ${note.title}`}
                                                >
                                                    <DotsThree className="h-4 w-4" weight="bold" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {onEditNote ? (
                                                    <DropdownMenuItem onClick={() => onEditNote(note.id)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                ) : null}
                                                {onDeleteNote ? (
                                                    <DropdownMenuItem onClick={() => onDeleteNote(note.id)}>
                                                        Delete
                                                    </DropdownMenuItem>
                                                ) : null}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                ) : null}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: NoteStatus }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "text-xs font-normal capitalize",
                status === "completed"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100"
                    : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-50"
            )}
        >
            {status}
        </Badge>
    )
}
