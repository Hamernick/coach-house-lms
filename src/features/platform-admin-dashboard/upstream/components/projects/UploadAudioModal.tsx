"use client"

import { useRef, useState } from "react"
import { CircleNotch, UploadSimple } from "@phosphor-icons/react/dist/ssr"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/features/platform-admin-dashboard/upstream/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

type UploadAudioModalProps = {
    accept?: string
    description?: string
    multiple?: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
    onFileSelect: (files: File[]) => Promise<boolean | void> | boolean | void
    title?: string
}

export function UploadAudioModal({
    accept = "audio/*,video/*",
    description = "Supports MP3, WAV, M4A, FLAC, AAC, MP4, MOV, AVI, MKV and more",
    multiple = false,
    open,
    onOpenChange,
    onFileSelect,
    title = "Upload New Audio File",
}: UploadAudioModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleFiles = async (files: FileList | File[]) => {
        const selectedFiles = Array.from(files)
        if (selectedFiles.length === 0) return

        setIsSubmitting(true)
        try {
            const shouldClose = await onFileSelect(selectedFiles)
            if (shouldClose !== false) {
                onOpenChange(false)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (isSubmitting) return
        const files = e.dataTransfer.files
        if (files.length > 0) {
            void handleFiles(files)
        }
    }

    const handleClick = () => {
        if (isSubmitting) return
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            void handleFiles(files)
        }
        e.target.value = ""
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isSubmitting) return
                onOpenChange(nextOpen)
            }}
        >
            <DialogContent className="sm:max-w-[600px] z-[60] p-6 gap-0 rounded-3xl border border-border shadow-2xl">
                <DialogHeader>
                    <VisuallyHidden>
                        <DialogTitle>{title}</DialogTitle>
                    </VisuallyHidden>
                    <div className="flex items-center gap-2 text-base font-medium">
                        {isSubmitting ? (
                            <CircleNotch className="h-4 w-4 animate-spin" />
                        ) : (
                            <UploadSimple className="h-4 w-4" />
                        )}
                        {title}
                    </div>
                </DialogHeader>

                <div
                    className="mt-4 flex min-h-56 touch-manipulation flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 sm:p-12"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    aria-disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <CircleNotch className="mb-4 h-10 w-10 animate-spin text-muted-foreground/60" />
                    ) : (
                        <UploadSimple className="mb-4 h-10 w-10 text-muted-foreground/50" />
                    )}
                    <p className="text-sm font-medium text-foreground">
                        {isSubmitting
                            ? "Uploading selected file…"
                            : "Drop files here or click to browse"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                    multiple={multiple}
                />
            </DialogContent>
        </Dialog>
    )
}
