"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationPolicyFile } from "./organization-policy-files"
import type { FolderFile, FolderOrganizationDocuments } from "../../lib/project-asset-folders"

const OrganizationCoreDocumentEditor = dynamic(() => import("./organization-core-document-editor").then((module) => module.OrganizationCoreDocumentEditor))

export function ProjectFolderDocumentEditor({ file, documents, organizationId, onClose, onSaved, onOpen }: {
  file: FolderFile
  documents: FolderOrganizationDocuments
  organizationId: string
  onClose: () => void
  onSaved: () => void
  onOpen: (url: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = file.key.slice(file.key.indexOf(":") + 1)
  const section = file.source === "core" ? documents.sections.find((item) => item.id === id) : undefined
  if (section) return <OrganizationCoreDocumentEditor section={section} organizationId={organizationId} userId={documents.userId} onClose={onClose} onSaved={onSaved} />
  const policy = file.source === "policy" ? documents.policies.find((item) => item.id === id) : undefined
  const upload = file.source === "upload" ? documents.uploads.find((item) => item.kind === id) : undefined
  const url = `/api/account/org-documents?${new URLSearchParams({ organizationId, kind: id })}`
  const saveUpload = async (selected: File) => {
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.append("file", selected)
      const response = await fetch(url, { method: "POST", body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Unable to upload document.")
      toast.success("Document saved")
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upload document.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader><DialogTitle>{file.name}</DialogTitle><DialogDescription>View or update this organization document.</DialogDescription></DialogHeader>
        {policy ? <OrganizationPolicyFile key={`${policy.id}:${policy.updatedAt}`} policy={policy} organizationId={organizationId} onSaved={onSaved} onOpen={onOpen} /> : null}
        {upload ? <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{upload.document?.name ?? "No file uploaded yet."}</p>
          {upload.document ? <Button variant="outline" onClick={() => void onOpen(url)}>Open file</Button> : null}
          <Input type="file" aria-label={`${upload.document ? "Replace" : "Upload"} ${file.name}`} disabled={busy} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void saveUpload(selected); event.target.value = "" }} />
          {busy ? <p role="status" className="text-sm text-muted-foreground">Uploading…</p> : null}
        </div> : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}
