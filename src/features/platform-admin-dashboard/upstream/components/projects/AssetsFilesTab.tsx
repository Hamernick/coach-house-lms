"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { ProjectFile } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { RecentFileCard } from "@/features/platform-admin-dashboard/upstream/components/projects/RecentFileCard"
import { FilesTable } from "@/features/platform-admin-dashboard/upstream/components/projects/FilesTable"
import {
    AddFileModal,
    type AddFileModalSubmitInput,
} from "@/features/platform-admin-dashboard/upstream/components/projects/AddFileModal"

type AssetsFilesTabProps = {
    files: ProjectFile[]
    onCreateAsset: (input: AddFileModalSubmitInput) => Promise<void>
    onUpdateAsset: (
        fileId: string,
        input: AddFileModalSubmitInput,
    ) => Promise<void>
    onDeleteAsset: (fileId: string) => Promise<void>
}

export function AssetsFilesTab({
    files,
    onCreateAsset,
    onUpdateAsset,
    onDeleteAsset,
}: AssetsFilesTabProps) {
    const router = useRouter()
    const [items, setItems] = useState<ProjectFile[]>(files)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingFile, setEditingFile] = useState<ProjectFile | null>(null)

    useEffect(() => {
        setItems(files)
    }, [files])

    const recentFiles = useMemo(() => items.slice(0, 6), [items])

    const handleAddFile = () => {
        setEditingFile(null)
        setIsAddOpen(true)
    }

    const handleCreateFiles = async (input: AddFileModalSubmitInput) => {
        try {
            if (editingFile) {
                await onUpdateAsset(editingFile.id, input)
                toast.success("Asset updated")
            } else {
                await onCreateAsset(input)
                toast.success("Asset created")
            }

            setIsAddOpen(false)
            setEditingFile(null)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to save asset.")
            throw error
        }
    }

    const handleEditFile = (fileId: string) => {
        const file = items.find((item) => item.id === fileId) ?? null
        if (!file) return
        setEditingFile(file)
        setIsAddOpen(true)
    }

    const handleDeleteFile = async (fileId: string) => {
        try {
            await onDeleteAsset(fileId)
            setItems((prev) => prev.filter((file) => file.id !== fileId))
            toast.success("Asset deleted")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to delete asset.")
        }
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="mb-4 text-sm font-semibold text-accent-foreground">Recent Files</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentFiles.map((file) => (
                        <RecentFileCard
                            key={file.id}
                            file={file}
                            onEdit={handleEditFile}
                            onDelete={handleDeleteFile}
                        />
                    ))}
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-sm font-semibold text-accent-foreground">All files</h2>
                <FilesTable
                    files={items}
                    onAddFile={handleAddFile}
                    onEditFile={handleEditFile}
                    onDeleteFile={handleDeleteFile}
                />
            </section>

            <AddFileModal
                open={isAddOpen}
                onOpenChange={(open) => {
                    setIsAddOpen(open)
                    if (!open) {
                        setEditingFile(null)
                    }
                }}
                editingFile={editingFile}
                onCreate={handleCreateFiles}
            />
        </div>
    )
}
