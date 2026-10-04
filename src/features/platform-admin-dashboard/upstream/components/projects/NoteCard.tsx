import { File, DotsThree, Waveform } from "@phosphor-icons/react/dist/ssr"
import { format } from "date-fns"

import type { ProjectNote } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { Button } from "@/features/platform-admin-dashboard/upstream/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/platform-admin-dashboard/upstream/components/ui/dropdown-menu"

type NoteCardProps = {
    note: ProjectNote
    isSaving?: boolean
    onEdit?: (noteId: string) => void
    onDelete?: (noteId: string) => void
    onClick?: () => void
}

export function NoteCard({ note, isSaving, onEdit, onDelete, onClick }: NoteCardProps) {
    const isAudio = note.noteType === "audio"
    const canManageNote = Boolean(onEdit || onDelete)
    return (
        <div
            className="flex flex-col gap-1 rounded-xl border border-border bg-muted p-1 hover:shadow-sm hover:cursor-pointer transition-shadow motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
            role="button"
            tabIndex={0}
            aria-label={`Open note: ${note.title}`}
            aria-busy={isSaving}
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault()
                    onClick?.()
                }
            }}
        >
            <div className="flex items-center justify-between gap-2 p-1">
                <div className="flex h-6 w-6 items-center justify-center">
                    {isAudio ? (
                        <Waveform className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <File className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
                {canManageNote ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                aria-label={`Actions for ${note.title}`}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <DotsThree className="h-4 w-4" weight="bold" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                            {onEdit ? (
                                <DropdownMenuItem onClick={() => onEdit(note.id)}>
                                    Edit
                                </DropdownMenuItem>
                            ) : null}
                            {onDelete ? (
                                <DropdownMenuItem onClick={() => onDelete(note.id)}>
                                    Delete
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>

            <div className="rounded-lg bg-background px-3 py-3">
                <h3 className="text-md font-medium text-foreground line-clamp-1">
                    {note.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isSaving ? "Saving…" : format(note.addedDate, "d MMM")}
                </p>
            </div>
        </div>
    )
}
