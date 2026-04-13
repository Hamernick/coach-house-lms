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
import {
    buildNotePayloadForUploadedAssets,
    type NoteUploadKind,
    type UploadedNoteAsset,
} from "@/features/platform-admin-dashboard/upstream/components/projects/note-upload"

type NotesTabProps = {
    notes: ProjectNote[]
    currentUser?: User
    projectId?: string
    createNoteAction?: (input: {
        projectId: string
        title: string
        content?: string
        noteType?: "general" | "meeting" | "audio"
    }) => Promise<{ ok: true; noteId: string } | { error: string }>
    updateNoteAction?: (input: {
        projectId: string
        noteId: string
        title: string
        content?: string
        noteType?: "general" | "meeting" | "audio"
    }) => Promise<{ ok: true; noteId: string } | { error: string }>
    deleteNoteAction?: (input: {
        projectId: string
        noteId: string
    }) => Promise<{ ok: true } | { error: string }>
    uploadNoteAssets?: (input: {
        title?: string
        description?: string
        files: File[]
    }) => Promise<UploadedNoteAsset[]>
    deleteUploadedNoteAsset?: (assetId: string) => Promise<void>
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
    uploadNoteAssets,
    deleteUploadedNoteAsset,
}: NotesTabProps) {
    const router = useRouter()
    const [items, setItems] = useState<ProjectNote[]>(notes)
    const recentNotes = items.slice(0, 8)
    const canManageNotes = Boolean(createNoteAction || updateNoteAction || deleteNoteAction)
    const canUploadAttachments = Boolean(
        projectId && uploadNoteAssets && (createNoteAction || updateNoteAction),
    )

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
    const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null)
    const [editingNote, setEditingNote] = useState<ProjectNote | null>(null)
    const [pendingUpload, setPendingUpload] = useState<{
        content: string
        kind: NoteUploadKind
        title: string
    } | null>(null)

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

    const rollbackUploadedAssets = async (assets: UploadedNoteAsset[]) => {
        if (!deleteUploadedNoteAsset) return

        await Promise.allSettled(
            assets.map((asset) => deleteUploadedNoteAsset(asset.id)),
        )
    }

    const handleFileSelect = async (files: File[]) => {
        if (!pendingUpload || !projectId || !uploadNoteAssets) {
            toast.error("Note uploads are unavailable here.")
            return false
        }

        let uploadedAssets: UploadedNoteAsset[] = []

        try {
            uploadedAssets = await uploadNoteAssets({
                title: pendingUpload.title,
                files,
            })

            if (uploadedAssets.length === 0) {
                toast.error("No files were uploaded.")
                return false
            }

            const payload = buildNotePayloadForUploadedAssets({
                assets: uploadedAssets,
                draftContent: pendingUpload.content,
                draftTitle: pendingUpload.title,
                kind: pendingUpload.kind,
                previousNoteType: editingNote?.noteType,
            })

            if (editingNote && updateNoteAction) {
                const result = await updateNoteAction({
                    projectId,
                    noteId: editingNote.id,
                    title: payload.title,
                    content: payload.content,
                    noteType: payload.noteType,
                })

                if ("error" in result) {
                    await rollbackUploadedAssets(uploadedAssets)
                    toast.error(result.error)
                    return false
                }

                toast.success("Note updated with uploaded files")
            } else if (createNoteAction) {
                const result = await createNoteAction({
                    projectId,
                    title: payload.title,
                    content: payload.content,
                    noteType: payload.noteType,
                })

                if ("error" in result) {
                    await rollbackUploadedAssets(uploadedAssets)
                    toast.error(result.error)
                    return false
                }

                toast.success("Note created from uploaded files")
            } else {
                await rollbackUploadedAssets(uploadedAssets)
                toast.error("Note saving is unavailable here.")
                return false
            }

            setIsUploadModalOpen(false)
            setIsCreateModalOpen(false)
            setIsPreviewModalOpen(false)
            setPendingUpload(null)
            setEditingNote(null)
            router.refresh()
            return true
        } catch (error) {
            await rollbackUploadedAssets(uploadedAssets)
            toast.error(
                error instanceof Error ? error.message : "Unable to upload files.",
            )
            return false
        }
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

    const handleRequestUpload = (input: {
        content: string
        kind: NoteUploadKind
        title: string
    }) => {
        setPendingUpload(input)
        setIsUploadModalOpen(true)
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
                    {canManageNotes ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddNote}
                        >
                            <Plus className="h-4 w-4" />
                            Add notes
                        </Button>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {recentNotes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={canManageNotes ? handleEditNote : undefined}
                            onDelete={canManageNotes ? handleDeleteNote : undefined}
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
                    onAddNote={canManageNotes ? handleAddNote : undefined}
                    onEditNote={canManageNotes ? handleEditNote : undefined}
                    onDeleteNote={canManageNotes ? handleDeleteNote : undefined}
                    onNoteClick={handleNoteClick}
                />
            </section>

            <CreateNoteModal
                canUploadAttachments={canUploadAttachments}
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                currentUser={currentUser}
                initialTitle={editingNote?.title}
                initialContent={editingNote?.content}
                submitLabel={editingNote ? "Save note" : "Create Note"}
                onCreateNote={handleCreateNote}
                onRequestUpload={handleRequestUpload}
            />

            <UploadAudioModal
                open={canUploadAttachments && isUploadModalOpen}
                onOpenChange={(open) => {
                    setIsUploadModalOpen(open)
                    if (!open) {
                        setPendingUpload(null)
                    }
                }}
                onFileSelect={handleFileSelect}
                accept={
                    pendingUpload?.kind === "files"
                        ? ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.png,.jpg,.jpeg,.gif,.webp,.heic,.svg,.zip,.ppt,.pptx,.mp3,.wav,.m4a,.aac,.mp4,.mov"
                        : "audio/*,video/*"
                }
                description={
                    pendingUpload?.kind === "files"
                        ? "Attach project files, screenshots, documents, slides, archives, or media to this note."
                        : "Upload a recording or audio/video file and save it as a real project note."
                }
                multiple={pendingUpload?.kind === "files"}
                title={
                    pendingUpload?.kind === "files"
                        ? "Attach Files to Note"
                        : "Upload Audio for Note"
                }
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
