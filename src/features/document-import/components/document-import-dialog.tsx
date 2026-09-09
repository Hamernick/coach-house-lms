"use client"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { IconBrandGoogleDrive, IconUpload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DOCUMENT_IMPORT_ACCEPT, MAX_DOCUMENT_IMPORT_BYTES } from "../lib"
import type { ImportedDocument, DocumentImportMode } from "../types"

export function DocumentImportDialog({
  title,
  initialFile,
  hasContent,
  onImport,
  onClose,
  onPickGoogleDrive,
}: {
  title: string
  initialFile?: File
  hasContent: boolean
  onImport: (
    document: ImportedDocument,
    mode: DocumentImportMode
  ) => void | Promise<void>
  onPickGoogleDrive: () => Promise<string[]>
  onClose: () => void
}) {
  const [document, setDocument] = useState<ImportedDocument | null>(null)
  const [busy, setBusy] = useState(false)
  const [applying, setApplying] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const applyingRef = useRef(false)
  const selectionRef = useRef<{ file?: File; driveFileId?: string }>({})
  const [picking, setPicking] = useState(false)
  const [driveError, setDriveError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const initialFileRef = useRef(initialFile)
  const aliveRef = useRef(true)

  async function prepare(file?: File, driveFileId?: string) {
    selectionRef.current = { file, driveFileId }
    setDriveError(false)
    if (file && (!file.size || file.size > MAX_DOCUMENT_IMPORT_BYTES)) {
      setError("Choose a non-empty document up to 15 MB.")
      return
    }
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setBusy(true)
    setError(null)
    setDocument(null)
    try {
      const body = new FormData()
      if (file) body.set("file", file)
      const response = await fetch("/api/document-import", {
        method: "POST",
        signal: controller.signal,
        ...(driveFileId
          ? {
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ driveFileId }),
            }
          : { body }),
      })
      const result = (await response.json()) as {
        document?: ImportedDocument
        error?: string
        code?: string
      }
      if (!response.ok || !result.document) {
        setDriveError(
          ["google_revoked", "missing_refresh_token", "scope_denied"].includes(
            result.code ?? ""
          )
        )
        throw new Error(result.error ?? "Unable to import this document.")
      }
      if (!controller.signal.aborted) setDocument(result.document)
    } catch (error) {
      if (!controller.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Unable to import this document."
        )
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  useEffect(() => {
    aliveRef.current = true
    if (initialFileRef.current) void prepare(initialFileRef.current)
    return () => {
      aliveRef.current = false
      requestRef.current?.abort()
    }
  }, [])

  async function pickDrive() {
    setError(null)
    setPicking(true)
    setDriveError(true)
    try {
      const ids = await onPickGoogleDrive()
      if (aliveRef.current && ids[0]) await prepare(undefined, ids[0])
    } catch (error) {
      if (aliveRef.current) {
        setDriveError(
          error instanceof Error &&
            "requiresReconnect" in error &&
            error.requiresReconnect === true
        )
        setError(
          error instanceof Error
            ? error.message
            : "Unable to open Google Drive."
        )
      }
    } finally {
      if (aliveRef.current) setPicking(false)
    }
  }

  async function confirm(mode: DocumentImportMode) {
    if (!document || busy || applyingRef.current) return
    applyingRef.current = true
    setApplying(true)
    setBusy(true)
    setError(null)
    try {
      await onImport(document, mode)
      onClose()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save this document."
      )
    } finally {
      applyingRef.current = false
      if (aliveRef.current) {
        setBusy(false)
        setApplying(false)
      }
    }
  }

  function close() {
    if (applyingRef.current) return
    requestRef.current?.abort()
    onClose()
  }

  return (
    <Dialog
      open={!picking}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent
        {...getReactGrabOwnerProps({
          ownerId: "document-import:dialog",
          component: "DocumentImportDialog",
          source:
            "src/features/document-import/components/document-import-dialog.tsx",
          slot: "root",
        })}
        className="flex max-h-[85dvh] flex-col sm:max-w-2xl"
        onInteractOutside={(event) => {
          if (applying) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Import into {title}</DialogTitle>
          <DialogDescription>
            Word, Markdown, or Google Docs. Review the text before adding it.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          type="file"
          accept={DOCUMENT_IMPORT_ACCEPT}
          className="sr-only"
          aria-label="Choose document to import"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ""
            if (file) void prepare(file)
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <IconUpload data-icon="inline-start" />
            Upload file
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void pickDrive()}
          >
            <IconBrandGoogleDrive data-icon="inline-start" />
            Google Drive
          </Button>
        </div>
        {busy ? (
          <p role="status" className="text-muted-foreground text-sm">
            {applying ? "Adding document…" : "Preparing document…"}
          </p>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error}{" "}
              {!busy &&
              (selectionRef.current.file ||
                selectionRef.current.driveFileId) ? (
                <Button
                  variant="ghost"
                  onClick={() =>
                    void prepare(
                      selectionRef.current.file,
                      selectionRef.current.driveFileId
                    )
                  }
                >
                  Retry import
                </Button>
              ) : null}
              {driveError ? (
                <Link className="underline" href="/workspace?drawer=tools">
                  Manage connections
                </Link>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        {document ? (
          <>
            <p className="truncate text-sm font-medium">{document.name}</p>
            {document.warnings.map((warning) => (
              <p key={warning} className="text-muted-foreground text-sm">
                {warning}
              </p>
            ))}
            {document.sourceUrl ? (
              <p className="text-muted-foreground text-sm">
                Creates an editable Coach House copy with a source link. Changes
                stay in Coach House.
              </p>
            ) : null}
            <div
              className="prose prose-sm dark:prose-invert min-h-24 max-w-none min-w-0 overflow-auto overscroll-contain rounded-md border p-4 break-words [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2"
              aria-label="Import preview"
              dangerouslySetInnerHTML={{ __html: document.html }}
            />
          </>
        ) : null}
        <DialogFooter className="mt-auto flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={applying}
            onClick={close}
          >
            Cancel
          </Button>
          {hasContent ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy || !document}
              onClick={() => setConfirmReplace(true)}
            >
              Replace document
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={busy || !document}
            onClick={() => void confirm(hasContent ? "append" : "replace")}
          >
            {hasContent ? "Add to document" : "Import document"}
          </Button>
        </DialogFooter>
        <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace document text?</AlertDialogTitle>
              <AlertDialogDescription>
                This replaces the current text with the import. Choose Add to
                document to keep both.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep existing text</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirm("replace")}>
                Confirm replacement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
