"use client"

import { pickGoogleDriveFiles } from "@/features/google-drive/client"
import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { saveRoadmapSectionAction } from "@/actions/roadmap"
import {
  hasDocumentContent,
  importedDocumentHtml,
  isImportableDocument,
  mergeImportedDocument,
} from "@/features/document-import/client"
import { toast } from "@/lib/toast"
import type { DocumentsRoadmapSection } from "../types"

const ImportDialog = dynamic(
  () =>
    import("@/features/document-import/client").then(
      (module) => module.DocumentImportDialog
    ),
  { loading: () => null }
)

export function useCoreDocumentImport(sections: DocumentsRoadmapSection[]) {
  const [overrides, setOverrides] = useState<
    Record<string, DocumentsRoadmapSection>
  >({})
  const [target, setTarget] = useState<{
    section: DocumentsRoadmapSection
    file: File
  } | null>(null)
  const currentSections = useMemo(
    () =>
      sections.map((section) => {
        const override = overrides[section.id]
        return override &&
          (override.lastUpdated ?? "") >= (section.lastUpdated ?? "")
          ? override
          : section
      }),
    [sections, overrides]
  )

  function prepareImport(sectionId: string, file: File) {
    const section = currentSections.find((entry) => entry.id === sectionId)
    if (section && isImportableDocument(file.name)) {
      setTarget({ section, file })
      return true
    }
    return false
  }

  const dialog = target ? (
    <ImportDialog
      onPickGoogleDrive={pickGoogleDriveFiles}
      key={target.section.id}
      title={target.section.title}
      initialFile={target.file}
      hasContent={hasDocumentContent(target.section.content ?? "")}
      onClose={() => setTarget(null)}
      onImport={async (document, mode) => {
        const result = await saveRoadmapSectionAction({
          sectionId: target.section.id,
          expectedLastUpdated: target.section.lastUpdated,
          content: mergeImportedDocument(
            target.section.content ?? "",
            importedDocumentHtml(document),
            mode
          ),
          status:
            target.section.status === "not_started" ? "in_progress" : undefined,
        })
        if ("error" in result) throw new Error(result.error)
        setOverrides((current) => ({
          ...current,
          [result.section.id]: { ...result.section, hasContent: true },
        }))
        toast.success("Document imported")
      }}
    />
  ) : null
  return { sections: currentSections, prepareImport, dialog }
}
