"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"

import type { ProjectNote, User } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { Button } from "@/features/platform-admin-dashboard/upstream/components/ui/button"
import { NoteCard } from "@/features/platform-admin-dashboard/upstream/components/projects/NoteCard"
import { NotesTable } from "@/features/platform-admin-dashboard/upstream/components/projects/NotesTable"
import { CreateNoteModal } from "@/features/platform-admin-dashboard/upstream/components/projects/CreateNoteModal"
import { UploadAudioModal } from "@/features/platform-admin-dashboard/upstream/components/projects/UploadAudioModal"
import { NotePreviewModal } from "@/features/platform-admin-dashboard/upstream/components/projects/NotePreviewModal"

type NotesTabProps = {
    notes: ProjectNote[]
    currentUser?: User
    projectId?: string
    createNoteAction?: (input: {
        projectId: string
        title: string
        content?: string
    }) => Promise<{ ok: true; noteId: string } | { error: string }>
    updateNoteAction?: (input: {
        projectId: string
        noteId: string
        title: string
        content?: string
    }) => Promise<{ ok: true; noteId: string } | { error: string }>
    deleteNoteAction?: (input: {
        projectId: string
        noteId: string
    }) => Promise<{ ok: true } | { error: string }>
}

const defaultUser: User = {
    id: "jason-d",
    name: "JasonD",
    avatarUrl: undefined,
}

export function NotesTab({
    notes,
    currentUser = defaultUser,
    projectId,
    createNoteAction,
    updateNoteAction,
    deleteNoteAction,
}: NotesTabProps) {
    const router = useRouter()
    const [items, setItems] = useState<ProjectNote[]>(notes)
    const recentNotes = items.slice(0, 8)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
    const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null)
    const [editingNote, setEditingNote] = useState<ProjectNote | null>(null)

    useEffect(() => {
        setItems(notes)
    }, [notes])

    const handleAddNote = () => {
        setEditingNote(null)
        setIsCreateModalOpen(true)
    }

    const handleCreateNote = async (title: string, content: string) => {
        if (!projectId) {
            toast.error("Project note context is missing.")
            return
        }

        if (editingNote && updateNoteAction) {
            const result = await updateNoteAction({
                projectId,
                noteId: editingNote.id,
                title,
                content,
            })

            if ("error" in result) {
                toast.error(result.error)
                return
            }

            toast.success("Note updated")
            setEditingNote(null)
            router.refresh()
            return
        }

        if (createNoteAction) {
            const result = await createNoteAction({
                projectId,
                title,
                content,
            })

            if ("error" in result) {
                toast.error(result.error)
                return
            }

            toast.success("Note created")
            router.refresh()
            return
        }

        console.log("Creating note:", { title, content })
        toast.success("Note created")
    }

    const handleUploadAudio = () => {
        setIsUploadModalOpen(true)
    }

    const handleFileSelect = (fileName: string) => {
        console.log("File selected:", fileName)

        // Close both modals
        setIsUploadModalOpen(false)
        setIsCreateModalOpen(false)

        // Simulate processing the uploaded file into a note
        toast(`Processing "${fileName}" into a note...`)

        setTimeout(() => {
            toast.success(`Note created from "${fileName}"`)
        }, 5000)
    }

    const handleNoteClick = (note: ProjectNote) => {
        setSelectedNote(note)
        setIsPreviewModalOpen(true)
    }

    const handleEditNote = (noteId: string) => {
        const note = items.find((item) => item.id === noteId) ?? null
        if (!note) return
        setEditingNote(note)
        setIsPreviewModalOpen(false)
        setIsCreateModalOpen(true)
    }

    const handleDeleteNote = async (noteId: string) => {
        if (!projectId || !deleteNoteAction) {
            console.log("Delete note:", noteId)
            return
        }

        const result = await deleteNoteAction({
            projectId,
            noteId,
        })

        if ("error" in result) {
            toast.error(result.error)
            return
        }

        toast.success("Note deleted")
        setSelectedNote((current) => (current?.id === noteId ? null : current))
        setItems((prev) => prev.filter((note) => note.id !== noteId))
        router.refresh()
    }

    return (
        <div className="space-y-8">
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-accent-foreground">
                        Recent notes
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddNote}
                    >
                        <Plus className="h-4 w-4" />
                        Add notes
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {recentNotes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={handleEditNote}
                            onDelete={handleDeleteNote}
                            onClick={() => handleNoteClick(note)}
                        />
                    ))}
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-sm font-semibold text-accent-foreground">
                    All notes
                </h2>
                <NotesTable
                    notes={items}
                    onAddNote={handleAddNote}
                    onEditNote={handleEditNote}
                    onDeleteNote={handleDeleteNote}
                    onNoteClick={handleNoteClick}
                />
            </section>

            <CreateNoteModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                currentUser={currentUser}
                initialTitle={editingNote?.title}
                initialContent={editingNote?.content}
                submitLabel={editingNote ? "Save note" : "Create Note"}
                onCreateNote={handleCreateNote}
                onUploadAudio={handleUploadAudio}
            />

            <UploadAudioModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                onFileSelect={handleFileSelect}
            />

            <NotePreviewModal
                open={isPreviewModalOpen}
                onOpenChange={setIsPreviewModalOpen}
                note={selectedNote}
                onEditNote={handleEditNote}
            />
        </div>
    )
}
