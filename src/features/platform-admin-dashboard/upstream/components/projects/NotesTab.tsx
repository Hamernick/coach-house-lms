"use client"

import { useEffect, useReducer, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { ProjectNote, User } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { NotesCollection } from "./notes-collection"
import { projectNoteReducer } from "../../lib/project-note-state"
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
    const [{ items, savingNoteId }, dispatch] = useReducer(projectNoteReducer, { items: notes, localNotes: [] })
    const savingRef = useRef(false)
    const [recoveredDraft, setRecoveredDraft] = useState<{ title: string; content: string } | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
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
        dispatch({ type: "sync", notes })
    }, [notes])

    const handleAddNote = () => {
        setRecoveredDraft(null)
        setSaveError(null)
        setEditingNote(null)
        setIsCreateModalOpen(true)
    }

    const handleCreateNote = async (title: string, content: string) => {
        if (savingRef.current) return
        if (!projectId || !(editingNote ? updateNoteAction : createNoteAction)) {
            toast.error("Note saving is unavailable here.")
            return
        }
        if (!title.trim()) return

        const original = editingNote ?? undefined
        const note: ProjectNote = {
            ...original,
            id: original?.id ?? crypto.randomUUID(),
            title: title.trim(),
            content,
            addedBy: original?.addedBy ?? currentUser,
            addedDate: original?.addedDate ?? new Date(),
            noteType: original?.noteType ?? "general",
            status: original?.status ?? "completed",
        }
        savingRef.current = true
        setSaveError(null)
        dispatch({ type: "start", note })
        setIsCreateModalOpen(false)
        try {
            const payload = { projectId, title: note.title, content, noteType: note.noteType }
            const result = original
                ? await updateNoteAction!({ ...payload, noteId: original.id })
                : await createNoteAction!(payload)
            if ("error" in result) throw new Error(result.error)

            dispatch({ type: "saved", temporaryId: note.id, noteId: result.noteId })
            setSelectedNote((current) => current?.id === note.id ? { ...note, id: result.noteId } : current)
            setEditingNote(null)
            setRecoveredDraft(null)
            toast.success(original ? "Note updated" : "Note created")
            router.refresh()
        } catch (error) {
            dispatch({ type: "failed", temporaryId: note.id, original })
            const message = error instanceof Error ? error.message : "Unable to save note. Try again."
            setSaveError(message)
            setIsPreviewModalOpen(false)
            setRecoveredDraft({ title, content })
            setIsCreateModalOpen(true)
            toast.error(message)
        } finally {
            savingRef.current = false
        }
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

            let savedNoteId: string
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

                savedNoteId = result.noteId
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

                savedNoteId = result.noteId
                toast.success("Note created from uploaded files")
            } else {
                await rollbackUploadedAssets(uploadedAssets)
                toast.error("Note saving is unavailable here.")
                return false
            }

            dispatch({ type: "start", note: { ...editingNote, id: savedNoteId, ...payload, addedBy: editingNote?.addedBy ?? currentUser, addedDate: editingNote?.addedDate ?? new Date(), status: "completed" } })
            dispatch({ type: "saved", temporaryId: savedNoteId, noteId: savedNoteId })
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
        setRecoveredDraft(null)
        setSaveError(null)
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
        dispatch({ type: "remove", noteId })
        router.refresh()
    }

    return (
        <div className="space-y-8">
            <NotesCollection
                notes={items}
                savingNoteId={savingNoteId}
                onAddNote={createNoteAction ? handleAddNote : undefined}
                onEditNote={updateNoteAction && !savingNoteId ? handleEditNote : undefined}
                onDeleteNote={deleteNoteAction && !savingNoteId ? handleDeleteNote : undefined}
                onNoteClick={handleNoteClick}
            />

            <CreateNoteModal
                canUploadAttachments={canUploadAttachments}
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                currentUser={currentUser}
                initialTitle={recoveredDraft?.title ?? editingNote?.title}
                initialContent={recoveredDraft?.content ?? editingNote?.content}
                isEditing={Boolean(editingNote)}
                error={saveError}
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
                onEditNote={updateNoteAction && !savingNoteId ? handleEditNote : undefined}
            />
        </div>
    )
}
