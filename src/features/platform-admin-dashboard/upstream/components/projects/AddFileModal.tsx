"use client"

import { useEffect, useMemo, useState } from "react"
import { Paperclip, UploadSimple, X } from "@phosphor-icons/react/dist/ssr"

import type { ProjectFile } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { Button } from "@/features/platform-admin-dashboard/upstream/components/ui/button"
import { QuickCreateModalLayout } from "@/features/platform-admin-dashboard/upstream/components/QuickCreateModalLayout"
import { ProjectDescriptionEditor } from "@/features/platform-admin-dashboard/upstream/components/project-wizard/ProjectDescriptionEditor"
import { UploadAssetFilesModal } from "@/features/platform-admin-dashboard/upstream/components/projects/UploadAssetFilesModal"

export type AddFileModalSubmitInput = {
    title?: string
    description?: string
    link?: string
    files: File[]
}

type AddFileModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingFile?: ProjectFile | null
    onCreate: (input: AddFileModalSubmitInput) => Promise<void> | void
}

export function AddFileModal({
    open,
    onOpenChange,
    editingFile,
    onCreate,
}: AddFileModalProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState<string | undefined>(undefined)
    const [link, setLink] = useState("")
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [isExpanded, setIsExpanded] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isEditing = Boolean(editingFile)

    useEffect(() => {
        if (!open) return

        setTitle(editingFile?.name ?? "")
        setDescription(editingFile?.description)
        setLink(editingFile?.isLinkAsset ? editingFile.url : "")
        setPendingFiles([])
        setIsUploadModalOpen(false)
        setIsExpanded(false)
        setIsSubmitting(false)
    }, [editingFile, open])

    const attachmentSummaries = useMemo(() => {
        if (pendingFiles.length > 0) {
            return pendingFiles.map((f) => ({
                name: f.name,
                sizeMB: +(f.size / (1024 * 1024)).toFixed(1),
            }))
        }

        if (editingFile && !editingFile.isLinkAsset) {
            return [
                {
                    name: editingFile.name,
                    sizeMB: editingFile.sizeMB,
                },
            ]
        }

        return []
    }, [editingFile, pendingFiles])

    const handleClose = () => {
        if (isSubmitting) return
        onOpenChange(false)
    }

    const canSubmit = isEditing
        ? Boolean(title.trim()) && (editingFile?.isLinkAsset ? Boolean(link.trim()) : true)
        : Boolean(link.trim() || pendingFiles.length > 0)

    const handleCreateAsset = async () => {
        if (!canSubmit) return

        const trimmedLink = link.trim()
        setIsSubmitting(true)
        try {
            await onCreate({
                title: title.trim() || undefined,
                description: description?.trim() || undefined,
                link: trimmedLink || undefined,
                files: pendingFiles,
            })
            onOpenChange(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFilesSelected = (files: File[]) => {
        if (!files.length) return
        setPendingFiles((prev) => [...prev, ...files])
    }

    return (
        <>
            <QuickCreateModalLayout
                open={open}
                onClose={handleClose}
                isDescriptionExpanded={isExpanded}
                onSubmitShortcut={handleCreateAsset}
            >
                <div className="flex items-center justify-between gap-2 w-full shrink-0 mt-1">
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex gap-1 h-10 items-center w-full">
                            <input
                                id="asset-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Asset title"
                                className="w-full font-normal leading-7 text-foreground placeholder:text-muted-foreground text-xl outline-none bg-transparent border-none p-0"
                                autoComplete="off"
                            />
                        </div>

                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                        onClick={handleClose}
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

                <ProjectDescriptionEditor
                    value={description}
                    onChange={setDescription}
                    onExpandChange={setIsExpanded}
                    placeholder="Describe this asset..."
                    showTemplates={false}
                />

                <div className="flex items-center gap-2 mt-2">
                    <input
                        id="asset-link"
                        type="url"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder={
                            isEditing && editingFile && !editingFile.isLinkAsset
                                ? "Uploaded files can be renamed and described here"
                                : "Paste a link (Figma, Drive, or any URL)"
                        }
                        className="w-full text-md leading-6 text-foreground placeholder:text-muted-foreground outline-none bg-transparent border-none p-0"
                        autoComplete="off"
                        disabled={Boolean(isEditing && editingFile && !editingFile.isLinkAsset)}
                    />
                </div>

                <div className="mt-3 w-full">
                    {attachmentSummaries.length > 0 ? (
                        <div className="space-y-2">
                            {attachmentSummaries.map((s) => (
                                <div
                                    key={s.name}
                                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <div className="truncate">{s.name}</div>
                                    </div>
                                    <div className="text-muted-foreground text-xs">{s.sizeMB.toFixed(1)} MB</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">No files attached yet.</p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-auto w-full pt-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground">
                            <Paperclip className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsUploadModalOpen(true)}
                                disabled={isSubmitting}
                            >
                                <UploadSimple className="h-4 w-4" />
                                Upload files
                            </Button>
                        ) : null}
                        <Button
                            size="sm"
                            onClick={handleCreateAsset}
                            disabled={!canSubmit || isSubmitting}
                        >
                            {isEditing ? "Save asset" : "Create asset"}
                        </Button>
                    </div>
                </div>
            </QuickCreateModalLayout>

            <UploadAssetFilesModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                onFilesSelect={handleFilesSelected}
            />
        </>
    )
}
