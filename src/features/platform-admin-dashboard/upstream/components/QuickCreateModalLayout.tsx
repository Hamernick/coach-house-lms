"use client"

import React, { useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

import { cn } from "@/features/platform-admin-dashboard/upstream/lib/utils"

interface QuickCreateModalLayoutProps {
    open: boolean
    title?: string
    onClose: () => void
    isDescriptionExpanded?: boolean
    onSubmitShortcut?: () => void
    className?: string
    contentClassName?: string
    children: React.ReactNode
}

export function QuickCreateModalLayout({
    open,
    title = "Create or edit item",
    onClose,
    isDescriptionExpanded,
    onSubmitShortcut,
    className,
    contentClassName,
    children,
}: QuickCreateModalLayoutProps) {
    const returnFocusRef = useRef<HTMLElement | null>(null)

    if (!open) return null

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onSubmitShortcut) return

        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault()
            onSubmitShortcut()
        }
    }

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
            <DialogContent
                showCloseButton={false}
                aria-describedby={undefined}
                overlayClassName="backdrop-blur-sm"
                className={cn(
                    "flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[720px] flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-background p-0 shadow-2xl sm:max-w-[720px]",
                    isDescriptionExpanded && "h-[85dvh]",
                    className,
                )}
                onOpenAutoFocus={() => {
                    returnFocusRef.current = document.activeElement instanceof HTMLElement
                        ? document.activeElement
                        : null
                }}
                onCloseAutoFocus={(event) => {
                    if (!returnFocusRef.current?.isConnected) return
                    event.preventDefault()
                    returnFocusRef.current.focus({ preventScroll: true })
                }}
                onKeyDown={handleKeyDown}
            >
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <div className={cn("flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain p-4", contentClassName)}>{children}</div>
            </DialogContent>
        </Dialog>
    )
}
