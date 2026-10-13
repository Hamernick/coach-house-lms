"use client"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { useState } from "react"
import dynamic from "next/dynamic"
import { IconFileImport } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  hasDocumentContent,
  importedDocumentHtml,
  mergeImportedDocument,
} from "../lib"
const ImportDialog = dynamic(
  () =>
    import("./document-import-dialog").then(
      (module) => module.DocumentImportDialog
    ),
  { loading: () => null }
)

export function DocumentImportButton({
  title = "document",
  content,
  onChange,
  onPickGoogleDrive,
}: {
  onPickGoogleDrive: () => Promise<string[]>
  title?: string
  content: string
  onChange: (html: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        {...getReactGrabOwnerProps({
          ownerId: "document-import:trigger",
          component: "DocumentImportButton",
          source:
            "src/features/document-import/components/document-import-button.tsx",
          slot: "root",
        })}
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-7 gap-1 px-1 sm:h-8 sm:px-1.5"
        aria-label="Import document"
        title="Import Word, Markdown, or Google Docs"
        onClick={() => setOpen(true)}
      >
        <IconFileImport data-icon="inline-start" />
        <span className="sr-only sm:not-sr-only">Import</span>
      </Button>
      {open ? (
        <ImportDialog
          title={title}
          onPickGoogleDrive={onPickGoogleDrive}
          hasContent={hasDocumentContent(content)}
          onClose={() => setOpen(false)}
          onImport={(document, mode) =>
            onChange(
              mergeImportedDocument(
                content,
                importedDocumentHtml(document),
                mode
              )
            )
          }
        />
      ) : null}
    </>
  )
}
